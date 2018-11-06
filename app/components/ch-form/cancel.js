import Component from '@ember/component';
import { tagName } from '@ember-decorators/component';
import { argument } from '@ember-decorators/argument';

@tagName('')
export default class ChFormCancelComponent extends Component {
  @argument label;
  @argument cancelClass;
  @argument disabled;
  @argument cancelAction;

  constructor() {
    super(...arguments);

    if (this.label == null) {
      this.label = 'Cancel';
    }
  }
}
