// (C) Copyright 2014-2015 Hewlett Packard Enterprise Development LP

import {
  NAV_ACTIVATE, NAV_ENABLE, NAV_RESPONSIVE
} from '../actions';

import { createReducer } from './utils';

const initialState = {
  active: true, // start with nav active
  enabled: true, // start with nav disabled
  responsive: 'multiple',
  items: [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/visitors', label: 'VISITORS' },
    { path: '/items', label: 'STORE MATERIAL' },
    { path: '/vehicles', label: 'VEHICLES' },
    { path: '/employees', label: 'ATTENDANCE' },
    { path: '/manpower', label: 'MAN POWER' },
    { path: '/configuration', label: 'CONFIGURATION' },
    { path: '/workmanager', label: 'WORK MANAGER' },
    { path: '/wheatentries', label: 'WHEAT ENTRIES' }
    ]
};

const handlers = {
  [NAV_ACTIVATE]: (_, action) => (
    { active: action.active, activateOnMultiple: undefined }
  ),

  [NAV_ENABLE]: (_, action) => (
    { enabled: action.enabled }
  ),

  [NAV_RESPONSIVE]: (state, action) => {
    const result = { responsive: action.responsive };
    if (action.responsive === 'single' && state.active) {
      result.active = false;
      result.activateOnMultiple = true;
    } else if (action.responsive === 'multiple' && state.activateOnMultiple) {
      result.active = true;
    }
    return result;
  }
};

export default createReducer(initialState, handlers);
