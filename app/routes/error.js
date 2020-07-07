import {TimeoutError, AbortError} from '@ember-data/adapter/error';
import Route from '@ember/routing/route';
import ENV from 'clubhouse/config/environment';
import {isAbortError, isTimeoutError, isForbiddenError} from 'ember-ajax/errors';
import logError from 'clubhouse/utils/log-error';

//
// Called by Ember when a route encounters an uncaught exception.
//
// Note this is not registered in app/router.js and called explicitly by the Ember framework.

export default class ErrorRoute extends Route {
  setupController(controller, error) {
    super.setupController(...arguments);
    controller.set('error', error);
    controller.set('config', ENV);

    // Check for offline errors
    const isOffline =
      (error instanceof TimeoutError || error instanceof AbortError
        || isAbortError(error) || isTimeoutError(error));

    controller.set('isOffline', isOffline);
    controller.set('notAuthorized', (error && (isForbiddenError(error) || error.status == 403)));

    logError(error, 'ember-route-error');
  }
}
