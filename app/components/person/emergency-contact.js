import Component from '@ember/component';
import { argument } from '@ember-decorators/argument';
import { action } from '@ember/object';
import EmergencyContactValidations from 'clubhouse/validations/emergency-contact';

export default class PersonEmergencyContactComponent extends Component {
  @argument('object') person;
  @argument('object') onCancel;

  emergencyContactValidations = EmergencyContactValidations;

  isSaved = false;

  @action
  saveAction(model, isValid) {
    if (!isValid) {
      return;
    }
    this.set('isSubmitting', true);
    this.house.saveModel(model, 'Emergency contact info has been succesfully updated.', () => {
      this.set('isSaved', true);
    })
      .finally(() => this.set('isSubmitting', false));
  }
}
