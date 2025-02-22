import * as React from 'react';
import { connect } from 'react-redux';

import * as plugins from '../../../plugins';
import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  DashboardCardTitle,
  DashboardCardPopupLink,
} from '../../dashboard/dashboard-card';
import { AlertsBody, AlertItem, getAlerts, HealthBody, HealthItem } from '../../dashboard/health-card';
import { HealthState } from '../../dashboard/health-card/states';
import { coFetch } from '../../../co-fetch';
import { FLAGS } from '../../../const';
import { DashboardItemProps, withDashboardResources } from '../with-dashboard-resources';
import { getBrandingDetails } from '../../masthead';
import { RootState } from '../../../redux';
import { connectToFlags, flagPending, featureReducerName, FlagsObject, WithFlagsProps } from '../../../reducers/features';
import { getFlagsForExtensions } from '../utils';
import { uniqueResource } from './utils';
import { isDashboardsOverviewHealthURLSubsystem, isDashboardsOverviewHealthPrometheusSubsystem } from '@console/plugin-sdk';

export const HEALTHY = 'is healthy';
export const ERROR = 'is in an error state';

const getClusterHealth = (subsystemStates: Array<SubsystemHealth>): ClusterHealth => {
  let healthState: ClusterHealth = { state: HealthState.OK, message: 'Cluster is healthy' };
  const subsystemBySeverity = {
    error: subsystemStates.filter(subsystem => subsystem.state === HealthState.ERROR),
    warning: subsystemStates.filter(subsystem => subsystem.state === HealthState.WARNING),
    loading: subsystemStates.filter(subsystem => subsystem.state === HealthState.LOADING),
  };

  if (subsystemBySeverity.loading.length > 0) {
    healthState = { state: HealthState.LOADING, message: null };
  } else if (subsystemBySeverity.error.length > 0) {
    healthState =
      subsystemBySeverity.error.length === 1
        ? subsystemBySeverity.error[0]
        : { state: HealthState.ERROR, message: 'Multiple errors', details: 'Cluster health is degraded' };
  } else if (subsystemBySeverity.warning.length > 0) {
    healthState =
      subsystemBySeverity.warning.length === 1
        ? subsystemBySeverity.warning[0]
        : { state: HealthState.WARNING, message: 'Multiple warnings', details: 'Cluster health is degraded' };
  }

  return healthState;
};

const getName = (openshiftFlag: boolean): string => openshiftFlag ? getBrandingDetails().productName : 'Kubernetes';

const getK8sHealthState = (openshiftFlag: boolean, k8sHealth: any): SubsystemHealth => {
  if (!k8sHealth) {
    return { state: HealthState.LOADING };
  }
  return k8sHealth === 'ok'
    ? { message: `${getName(openshiftFlag)} ${HEALTHY}`, state: HealthState.OK }
    : { message: `${getName(openshiftFlag)} ${ERROR}`, state: HealthState.ERROR };
};

const fetchK8sHealth = async(url) => {
  const response = await coFetch(url);
  return response.text();
};

const mapStateToProps = (state: RootState) => ({
  openshiftFlag: state[featureReducerName].get(FLAGS.OPENSHIFT),
});

const getSubsystems = (flags: FlagsObject) =>
  plugins.registry.getDashboardsOverviewHealthSubsystems().filter(e => flags[e.properties.required]);

const HealthCard_ = connect(mapStateToProps)(({
  watchURL,
  stopWatchURL,
  watchPrometheus,
  stopWatchPrometheusQuery,
  watchAlerts,
  stopWatchAlerts,
  watchK8sResource,
  stopWatchK8sResource,
  resources,
  urlResults,
  prometheusResults,
  alertsResults,
  openshiftFlag,
  flags = {},
}: HealthProps) => {
  React.useEffect(() => {
    const subsystems = getSubsystems(flags);
    watchURL('healthz', fetchK8sHealth);
    watchAlerts();

    subsystems.forEach((subsystem, index) => {
      if (isDashboardsOverviewHealthURLSubsystem(subsystem)) {
        const { url, fetch } = subsystem.properties;
        watchURL(url, fetch);
      } else if (isDashboardsOverviewHealthPrometheusSubsystem(subsystem)) {
        const { query, resource } = subsystem.properties;
        watchPrometheus(query);
        if (resource) {
          watchK8sResource(uniqueResource(resource, index));
        }
      }
    });

    return () => {
      stopWatchURL('healthz');
      stopWatchAlerts();

      subsystems.forEach((subsystem, index) => {
        if (isDashboardsOverviewHealthURLSubsystem(subsystem)) {
          stopWatchURL(subsystem.properties.url);
        } else if (isDashboardsOverviewHealthPrometheusSubsystem(subsystem)) {
          const { query, resource } = subsystem.properties;
          stopWatchPrometheusQuery(query);
          if (resource) {
            stopWatchK8sResource(uniqueResource(resource, index));
          }
        }
      });
    };
  },
  // TODO: to be removed: use JSON.stringify(flags) to avoid deep comparison of flags object
  /* eslint-disable react-hooks/exhaustive-deps */
  [
    watchURL,
    stopWatchURL,
    watchPrometheus,
    stopWatchPrometheusQuery,
    watchAlerts,
    stopWatchAlerts,
    watchK8sResource,
    stopWatchK8sResource,
    stopWatchAlerts,
    JSON.stringify(flags),
  ]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const subsystems = getSubsystems(flags);
  const k8sHealth = urlResults.getIn(['healthz', 'result']);
  const k8sHealthState = getK8sHealthState(openshiftFlag, k8sHealth);

  const subsystemsHealths = subsystems.map((subsystem, index) => {
    if (isDashboardsOverviewHealthURLSubsystem(subsystem)) {
      return subsystem.properties.healthHandler(urlResults.getIn([subsystem.properties.url, 'result']));
    }
    const result = prometheusResults.getIn([subsystem.properties.query, 'result']);
    const resource = subsystem.properties.resource
      ? resources[uniqueResource(subsystem.properties.resource, index).prop]
      : null;
    return subsystem.properties.healthHandler(result, resource);
  });

  const healthState = getClusterHealth([k8sHealthState, ...subsystemsHealths]);
  const alerts = getAlerts(alertsResults);

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Cluster Health</DashboardCardTitle>
        {subsystems.length > 0 && !flagPending(openshiftFlag) && (
          <DashboardCardPopupLink linkTitle="See all" popupTitle="Subsystem Health">
            <HealthItem
              message={getName(openshiftFlag)}
              details={k8sHealthState.message}
              state={k8sHealthState.state}
            />
            {subsystemsHealths.map((subsystem, index) => (
              <div key={index}>
                <div className="co-health-card__separator" />
                <HealthItem
                  message={subsystems[index].properties.title}
                  details={subsystem.message}
                  state={subsystem.state}
                />
              </div>
            ))}
          </DashboardCardPopupLink>
        )}
      </DashboardCardHeader>
      <DashboardCardBody isLoading={flagPending(openshiftFlag)}>
        <HealthBody>
          <HealthItem
            state={healthState.state}
            message={healthState.message}
            details={healthState.details}
          />
        </HealthBody>
      </DashboardCardBody>

      {alerts.length > 0 &&
        <React.Fragment>
          <DashboardCardHeader className="co-health-card__alerts-border">
            <DashboardCardTitle>Alerts</DashboardCardTitle>
          </DashboardCardHeader>
          <DashboardCardBody isLoading={flagPending(openshiftFlag)}>
            <AlertsBody>
              {alerts.map(alert => (
                <AlertItem key={alert.fingerprint} alert={alert} />
              ))}
            </AlertsBody>
          </DashboardCardBody>
        </React.Fragment>
      }
    </DashboardCard>
  );
});

export const HealthCard = connectToFlags(
  ...getFlagsForExtensions(plugins.registry.getDashboardsOverviewHealthSubsystems())
)(withDashboardResources(HealthCard_));

type ClusterHealth = {
  state: HealthState;
  message?: string;
  details?: string,
};

export type SubsystemHealth = {
  message?: string;
  state: HealthState;
};

type HealthProps = DashboardItemProps & WithFlagsProps & {
  openshiftFlag: boolean;
}
