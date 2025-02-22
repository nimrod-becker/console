import * as React from 'react';
import * as _ from 'lodash';
import {
  Plugin,
  ModelDefinition,
  ModelFeatureFlag,
  HrefNavItem,
  ResourceNSNavItem,
  ResourceClusterNavItem,
  ResourceListPage,
  ResourceDetailsPage,
  Perspective,
  RoutePage,
} from '@console/plugin-sdk';
import { NamespaceRedirect } from '@console/internal/components/utils/namespace-redirect';
import { CodeIcon } from '@patternfly/react-icons';
import { FLAGS } from '@console/internal/const';
import * as models from './models';

const { PipelineModel, PipelineRunModel } = models;

type ConsumedExtensions =
  | ModelDefinition
  | ModelFeatureFlag
  | HrefNavItem
  | ResourceClusterNavItem
  | ResourceNSNavItem
  | ResourceListPage
  | ResourceDetailsPage
  | Perspective
  | RoutePage;

const SHOW_PIPELINE = 'SHOW_PIPELINE';

const plugin: Plugin<ConsumedExtensions> = [
  {
    type: 'ModelDefinition',
    properties: {
      models: _.values(models),
    },
  },
  {
    type: 'FeatureFlag/Model',
    properties: {
      model: models.PipelineModel,
      flag: SHOW_PIPELINE,
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      perspective: 'dev',
      componentProps: {
        name: '+Add',
        href: '/add',
        testID: '+Add-header',
      },
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      perspective: 'dev',
      componentProps: {
        name: 'Topology',
        href: '/topology',
        required: FLAGS.OPENSHIFT,
        testID: 'topology-header',
      },
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      perspective: 'dev',
      componentProps: {
        name: 'Builds',
        resource: 'buildconfigs',
        required: FLAGS.OPENSHIFT,
        testID: 'build-header',
      },
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      perspective: 'dev',
      componentProps: {
        name: 'Pipelines',
        resource: 'pipelines',
        required: SHOW_PIPELINE,
        testID: 'pipeline-header',
      },
    },
  },
  {
    type: 'NavItem/ResourceCluster',
    properties: {
      section: 'Advanced',
      perspective: 'dev',
      componentProps: {
        name: 'Projects',
        resource: 'projects',
        required: FLAGS.OPENSHIFT,
        testID: 'advanced-project-header',
      },
    },
  },
  {
    type: 'NavItem/ResourceNS',
    properties: {
      section: 'Advanced',
      perspective: 'dev',
      componentProps: {
        name: 'Events',
        resource: 'events',
        testID: 'advanced-events-header',
      },
    },
  },
  {
    type: 'NavItem/Href',
    properties: {
      section: 'Advanced',
      perspective: 'dev',
      componentProps: {
        name: 'Search',
        href: '/search',
        testID: 'advanced-search-header',
      },
    },
  },
  {
    type: 'Page/Resource/List',
    properties: {
      model: PipelineModel,
      loader: async () =>
        (await import(
          './components/pipelines/PipelinesPage' /* webpackChunkName: "pipeline-list" */
        )).default,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: PipelineModel,
      loader: async () =>
        (await import(
          './components/pipelines/PipelineDetailsPage' /* webpackChunkName: "pipeline-details" */
        )).default,
    },
  },
  {
    type: 'Page/Resource/Details',
    properties: {
      model: PipelineRunModel,
      loader: async () =>
        (await import(
          './components/pipelineruns/PipelineRunDetailsPage' /* webpackChunkName: "pipelinerun-details" */
        )).default,
    },
  },
  {
    type: 'Perspective',
    properties: {
      id: 'dev',
      name: 'Developer',
      icon: <CodeIcon />,
      getLandingPageURL: () => '/topology',
      getK8sLandingPageURL: () => '/add',
      getImportRedirectURL: (project) => `/topology/ns/${project}`,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/add', '/import', '/topology', '/deploy-image'],
      component: NamespaceRedirect,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/add/all-namespaces', '/add/ns/:ns'],
      loader: async () =>
        (await import('./components/AddPage' /* webpackChunkName: "dev-console-add" */)).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/topology/all-namespaces', '/topology/ns/:ns'],
      loader: async () =>
        (await import(
          './components/topology/TopologyPage' /* webpackChunkName: "dev-console-topology" */
        )).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/import/all-namespaces', '/import/ns/:ns'],
      loader: async () =>
        (await import(
          './components/import/ImportPage' /* webpackChunkName: "dev-console-import" */
        )).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/catalog/source-to-image'],
      loader: async () =>
        (await import(
          './components/import/ImportPage' /* webpackChunkName: "dev-console-import" */
        )).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      perspective: 'dev',
      exact: true,
      path: ['/k8s/all-namespaces/buildconfigs', '/k8s/ns/:ns/buildconfigs'],
      loader: async () =>
        (await import(
          './components/BuildConfigPage' /* webpackChunkName: "dev-console-buildconfigs" */
        )).default,
    },
  },
  {
    type: 'Page/Route',
    properties: {
      exact: true,
      path: ['/deploy-image/all-namespaces', '/deploy-image/ns/:ns'],
      loader: async () =>
        (await import(
          './components/import/DeployImagePage' /* webpackChunkName: "dev-console-deployImage" */
        )).default,
    },
  },
];

export default plugin;
