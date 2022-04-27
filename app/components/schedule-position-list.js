import Component from '@glimmer/component';
import {TRAINING} from 'clubhouse/constants/positions';

export default class SchedulePositionListComponent extends Component {
  constructor() {
    super(...arguments);
    this.haveNoAppreciationSlots = !!this.args.position.slots.find((s) => !s.position_count_hours);
    console.log("Position ", this.args.position);
    this.isTrainingPosition = this.args.position.position_id === TRAINING;
  }

  get signupCount() {
    return this.args.position.slots.reduce((signups, s) => ((s.person_assigned ? 1 : 0) + signups), 0);
  }
}
