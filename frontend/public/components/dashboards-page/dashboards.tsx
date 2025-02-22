import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';

import * as plugins from '../../plugins';
import { OverviewDashboard } from './overview-dashboard/overview-dashboard';
import { HorizontalNav, PageHeading, LoadingBox, Page, AsyncComponent } from '../utils';
import { Dashboard } from '../dashboard/dashboard';
import { DashboardGrid, GridPosition, GridDashboardCard } from '../dashboard/grid';
import { DashboardsCard } from '@console/plugin-sdk';
import { featureReducerName, connectToFlags, FlagsObject, WithFlagsProps } from '../../reducers/features';
import { RootState } from '../../redux';
import { getFlagsForExtensions } from './utils';

const getCardsOnPosition = (cards: DashboardsCard[], position: GridPosition): GridDashboardCard[] =>
  cards.filter(c => c.properties.position === position).map(c => ({
    Card: () => <AsyncComponent loader={c.properties.loader} />,
    span: c.properties.span,
  }));

const getPluginTabPages = (flags: FlagsObject): Page[] => {
  const cards = plugins.registry.getDashboardsCards().filter(e => flags[e.properties.required]);
  return plugins.registry.getDashboardsTabs().filter(e => flags[e.properties.required]).map(tab => {
    const tabCards = cards.filter(c => c.properties.tab === tab.properties.id);
    return {
      href: tab.properties.id,
      name: tab.properties.title,
      component: () => (
        <Dashboard>
          <DashboardGrid
            mainCards={getCardsOnPosition(tabCards, GridPosition.MAIN)}
            leftCards={getCardsOnPosition(tabCards, GridPosition.LEFT)}
            rightCards={getCardsOnPosition(tabCards, GridPosition.RIGHT)}
          />
        </Dashboard>
      ),
    };
  });
};

const getTabs = (flags: FlagsObject): Page[] => [
  {
    href: '',
    name: 'Overview',
    component: OverviewDashboard,
  },
  ...getPluginTabPages(flags),
];

const DashboardsPage_: React.FC<DashboardsPageProps> = ({ match, kindsInFlight, k8sModels, flags }) => {
  return kindsInFlight && k8sModels.size === 0
    ? <LoadingBox />
    : (
      <>
        <PageHeading title="Dashboards" detail={true} />
        <HorizontalNav match={match} pages={getTabs(flags)} noStatusBox />
      </>
    );
};

const mapStateToProps = (state: RootState) => ({
  kindsInFlight: state.k8s.getIn(['RESOURCES', 'inFlight']),
  k8sModels: state.k8s.getIn(['RESOURCES', 'models']),
  flags: state[featureReducerName],
});

export const DashboardsPage = connect(mapStateToProps)(
  connectToFlags(...getFlagsForExtensions([
    ...plugins.registry.getDashboardsCards(),
    ...plugins.registry.getDashboardsTabs(),
  ]))(DashboardsPage_)
);

type DashboardsPageProps = RouteComponentProps & WithFlagsProps & {
  kindsInFlight: boolean;
  k8sModels: ImmutableMap<string, any>;
};
