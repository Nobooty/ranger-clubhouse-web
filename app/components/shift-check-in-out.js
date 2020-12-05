import Component from '@glimmer/component';
import {set} from '@ember/object';
import {action, computed} from '@ember/object';
import {inject as service} from '@ember/service';
import * as Position from 'clubhouse/constants/positions';
import {tracked} from '@glimmer/tracking';

export default class ShiftCheckInOutComponent extends Component {
  @service ajax;
  @service house;
  @service modal;
  @service store;
  @service toast;
  @service session;

  @tracked signinPositionId = null;
  @tracked isSubmitting = false;
  @tracked isReloadingTimesheets = false;

  constructor() {
    super(...arguments);

    this.activePositions = this.args.positions.filter(position => position.active);

    // Mark imminent slots as trained or not.
    const slots = this.args.imminentSlots;
    if (slots) {
      slots.forEach((slot) => {
        const position = this.activePositions.find((p) => slot.position_id == p.id);
        if (position) {
          if (position.is_untrained) {
            set(slot, 'is_untrained', true);
          }

          if (position.is_unqualified) {
            set(slot, 'is_unqualified', true);
            set(slot, 'unqualified_reason', position.unqualified_reason);
            set(slot, 'unqualified_message', position.unqualified_message);
          }
        }
      });
    }

    const signins = this.activePositions.map((pos) => {
      let title = pos.title;
      let disqualified = null;

      if (pos.is_untrained) {
        disqualified = 'UNTRAINED';
      } else if (pos.is_unqualified) {
        disqualified = pos.unqualified_message;
      }

      if (disqualified) {
        title = `${title} (${disqualified})`;
      }

      return {id: pos.id, title};
    });

    // hack for operator convenience - Dirt is the most common
    // shift, so put that at top.

    const dirt = signins.find((p) => p.id == Position.DIRT);
    if (dirt) {
      signins.removeObject(dirt);
      signins.unshift(dirt);
    }

    // .. and Shiny Penny shift should also be on top
    const sp = signins.find((p) => p.id == Position.DIRT_SHINY_PENNY);
    if (sp) {
      signins.removeObject(sp);
      signins.unshift(sp);
    }

    this.signinPositions = signins;

    // Set the position options to the first item
    this.signinPositionId = this.signinPositions.length ? this.signinPositions.firstObject.id : null;

    // Has the person gone through dirt training?
    if (this.args.person.status === 'non ranger') {
      this.isPersonDirtTrained = true;
    } else {
      this.isPersonDirtTrained =!!this.args.eventInfo.trainings.find((training) => (training.position_id == Position.TRAINING && training.status === 'pass'));
    }
  }

  /**
   * Find the on duty/shift timesheet entry
   * @returns {TimesheetModel}
   */
  @computed('args.timesheets.@each.off_duty')
  get onDutyEntry() {
    return this.args.timesheets.findBy('off_duty', null);
  }

  /**
   * Start a shift.
   *
   * @param {number} positionId
   * @param {number} slotId
   * @private
   */

  _startShift(positionId, slotId = null) {
    const position = this.activePositions.find((p) => p.id == positionId);
    const person = this.args.person;

    const data = {
      position_id: position.id,
      person_id: person.id
    };

    if (slotId) {
      data.slot_id = slotId;
    }

    this.toast.clear();
    this.isSubmitting = true;
    this.ajax.request('timesheet/signin', {method: 'POST', data})
      .then((result) => {
        const callsign = person.callsign;
        switch (result.status) {
          case 'success':
            if (result.forced) {
              // Shift start was forced, let the user know what was overridden.
              let reason;
              if (result.unqualified_reason === 'untrained') {
                reason = `has not completed '${result.required_training}'`;
              } else {
                reason = `is unqualified ('${result.unqualified_message}')`;
              }
              this.modal.info('Sign In Forced', `WARNING: The person ${reason}. Because you are an admin or have the timesheet management role, we have signed them in anyways. Hope you know what you're doing! ${callsign} is now on duty.`);
            } else {
              this.toast.success(`${callsign} is on shift. Happy Dusty Adventures!`);
            }
            this.isReloadingTimesheets = true;
            // Refresh the timesheets
            this.args.timesheets.update()
              .catch((response) => this.house.handleErrorResponse(response))
              .finally(() => this.isReloadingTimesheets = false);
            if (this.args.person.id == this.session.userId) {
              // Ensure the navigation bar is updated with the signed into position
              this.session.loadUser();
            }
            break;

          case 'position-not-held':
            this.modal.info('Position Not Held', `${callsign} does hold the '${position.title}' in order to start the shift.`);
            break;

          case 'already-on-duty':
            this.modal.info('Already On Shift', `${callsign} is already on duty.`);
            break;

          case 'not-trained':
            this.modal.info('Not Trained', `${callsign} has has not completed "${result.position_title}" and cannot be signed into the shift.`);
            break;

          case 'not-qualified':
            this.modal.info('Not Qualified', `${callsign} has not meet one or more of the qualifiers needed to sign into the shift.<br>Reason: ${result.unqualified_message}`);
            break;

          default:
            this.modal.info('Unknown Server Status', `An unknown status [${result.status}] from the server. This is a bug. Please report this to the Tech Ninjas.`);
            break;
        }
      }).catch((response) => this.house.handleErrorResponse(response))
      .finally(() => this.isSubmitting = false);
  }

  /**
   * Start a shift with the selected position
   */
  @action
  startShiftAction() {
    this._startShift(this.signinPositionId);
  }

  /**
   * Start a shift based on a scheduled sign up.
   * @param slot
   */
  @action
  signinShiftAction(slot) {
    this._startShift(slot.position_id, slot.slot_id);
  }

  /**
   * End a shift.
   */

  @action
  endShiftAction() {
    const shift = this.onDutyEntry;
    const endShiftNotify = this.args.endShiftNotify;
    const callsign = this.args.person.callsign;

    this.isSubmitting = true;
    this.ajax.request(`timesheet/${shift.id}/signoff`, {method: 'POST'})
      .then((result) => {
        this.store.pushPayload(result);
        if (endShiftNotify) {
          endShiftNotify();
        }
        switch (result.status) {
          case 'success':
            this.toast.success(`${callsign} has been successfully signed off. Enjoy your rest.`);
            if (this.args.person.id == this.session.userId) {
              // Update the user's navigation bar to remove the signed in position.
              this.session.loadUser();
            }
            break;
          case 'already-signed-off':
            this.toast.error(`${callsign} was already signed off.`);
            break;

          default:
            this.toast.error(`Unknown signoff response [${result.status}].`);
            break;
        }
      }).catch((response) => this.house.handleErrorResponse(response))
      .finally(() => this.isSubmitting = false);
  }

  /**
   * Update the selected sign in position
   * @param value
   */
  @action
  updateShiftPosition(value) {
    this.signinPositionId = value;
  }
}
