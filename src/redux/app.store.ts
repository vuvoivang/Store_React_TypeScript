import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';
import { routerMiddleware, connectRouter } from 'connected-react-router';
import { configureStore as reduxConfigureStore } from '@reduxjs/toolkit';
import { pick } from 'lodash';
import { AppConstant } from '../constants/app.constant';
import * as StorageHelper from '../helpers/storage.helper';
import { languageActions, languageReducer } from './language';

const actionTypesWhitelist = ['@@router/LOCATION_CHANGE', 'language/setLocale'];

const statesToBeStoredInLocalStorage: { stateKey?: (state: any) => void} = {
  [AppConstant.redux.LANGUAGE_STATE]: languageActions.restoreLocale
};

const createAppReducer = history => ({
  [AppConstant.redux.ROUTER_STATE]: connectRouter(history),
  [AppConstant.redux.LANGUAGE_STATE]: languageReducer
});

const restoreState = store => {
  const rootStateFromStorage = StorageHelper.getState();
  if (!rootStateFromStorage) return;

  Object.entries(statesToBeStoredInLocalStorage).forEach(([stateKey, restoreFunc]) => {
    const state = rootStateFromStorage[stateKey];
    if (state) {
      store.dispatch(restoreFunc(state));
    }
  });
};

export const getInitialState = () => ({});

const storageMiddleware = ({ getState }) => next => action => {
  const result = next(action);
  if (actionTypesWhitelist.includes(action.type)) {
    const state = pick(getState(), Object.keys(statesToBeStoredInLocalStorage));
    StorageHelper.storeState(state);
  }
  return result;
};

export const configureStore = history => {
  const middlewares = [thunkMiddleware, routerMiddleware(history), storageMiddleware];
  if (process.env.NODE_ENV === 'development') {
    middlewares.push(createLogger({ collapsed: true }));
  }
  const store = reduxConfigureStore({
    reducer: createAppReducer(history),
    middleware: middlewares,
    devTools: process.env.NODE_ENV === 'development',
    preloadedState: getInitialState()
  });
  restoreState(store);

  return store;
};
