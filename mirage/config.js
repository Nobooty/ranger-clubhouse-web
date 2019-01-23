import Response from 'ember-cli-mirage/response';
import JWT from 'jsonwebtoken';

export default function() {
  this.urlPrefix = 'http://localhost:8000';

  this.get('/api/config', function()  {
    return {
      VCSRevision: 'DEVELOPMENT',

      // when the system is taken on-site, set OnPlaya = TRUE on the server that will
      // be in Black Rock City and set ReadOnly = TRUE on the system that remains
      // available to the internet so folks can check their schedules
      OnPlaya: false,
      ReadOnly: false,

      // Ranger Policies Link
      RangerPoliciesUrl: 'https://drive.google.com/drive/u/1/folders/0B9mqynALmDHDQ2VvaFB3SnVvMTg?ogsrc=32',

      // How to join Ranger special teams
      JoiningRangerSpecialTeamsUrl: 'https://docs.google.com/document/d/1xEVnm1SdcyvLnsUYwL5v_WxO1zy3yhMkAmbXIU_0yqc',

      // Meal date info (needs to change every year)
      MealInfoAvailable: false,
      MealDates: 'Pre Event is Tue 8/8 (dinner) - Sun 8/27; During Event is Mon 8/28 - Mon 9/4; Post Event is Tue 9/5 - Sat 9/9 (lunch)',

      RadioCheckoutFormUrl: 'https://drive.google.com/open?id=1p4EerIDN6ZRxcWkI7tDFGuMf6SgL1LTQ',

      SiteNotice: 'Copyright 2008-2018 Black Rock City, LLC. All information contained within this website is strictly confidential.',

      SiteTitle:  'Black Rock Rangers Secret Clubhouse',
      AdminEmail: 'ranger-tech-ninjas@burningman.org',
      GeneralSupportEmail: 'rangers@burningman.org',
      VCEmail: 'ranger-vc-list@burningman.org',
      SignupUrl: 'http://jousting-at-windmills.org/clubhouse/',

      // Optional ticket credit warning messages.
      // If any are not set, no message will be displayed
      RpTicketThreshold: 19,  // Ticket threshold for reduced price
      ScTicketThreshold: 38,  // Ticket threshold for staff credential
      YrTicketThreshold: 2018,  // Ticket threshold year
    };
  });

  this.post('/api/auth/login', function(schema, request) {
    let params = JSON.parse(request.requestBody);

    if (!params.identification || !params.password) {
      const errors = [];

      if (!params.identification) {
        errors.push({ status: 422, title: 'Email cannot be blank'});
      }

      if (!params.password) {
        errors.push({ status: 422, title: 'Password cannot be blank'});
      }

      return new Response(422, {'Content-Type': 'application/json'}, { errors });
    }

    const person = schema.db.people.findBy({ email: params.identification });
    if (!person) {
      return new Response(401,
        { 'Content-Type': 'application/json' },
        { error: 'The email and/or password is incorrect.' }
      );
    }

    if (!person.user_authorized) {
      return new Response(401, 
        { 'Content-Type': 'application/json' },
        { error: 'The account has been disabled.' }
      )
    }

    let token = JWT.sign({person_id: person.id}, 'secret', { expiresIn: 1000 });
    let data =  {
      token,
      token_type: 'bearer',
      expires_in: 1000,
      person_id:  person.id,
   };

    return data;
  });

  this.get('/api/person/:id', ({people}, request) => { // eslint-disable-line no-unused-vars
    const person = people.find(request.params.id);

    if (!person) {
      return new Response(404, { 'Content-Type': 'application/json' }, {
        errors: [ { status: 404, title: 'Record does not exist.'}]
      } );
    }

    return person;
    //return this.serializerOrRegistry.serialize(person, 'person');
  });

  this.get('/api/person/:id/years', ({people}, request) => { // eslint-disable-line no-unused-vars
    return { years: [ 2017, 2018 ]};
  });

  this.get('/api/person/:id/unread-message-count', ({people}, request) => { // eslint-disable-line no-unused-vars
    return { unread_message_count: 2};
  });

  this.get('/api/person/:id/teacher', ({people}, request) => { // eslint-disable-line no-unused-vars
    return {
      is_trainer: false,
      is_art_trainer: false,
      is_mentor: false,
      have_mentored: false
    };
  });

  this.get('/api/person/:id/photo', ({people}, request) => { // eslint-disable-line no-unused-vars
    return {
      source: 'local',
      photo_status: 'missing',
      message: 'upload photo',
      photo_url: '',
      upload_url: ''
    };
  });


  this.get('/api/position', ({positions}) => {
    return positions.all();
  });

  /*
    Shorthand cheatsheet:

    this.get('/posts');
    this.post('/posts');
    this.get('/posts/:id');
    this.put('/posts/:id'); // or this.patch
    this.del('/posts/:id');

    http://www.ember-cli-mirage.com/docs/v0.3.x/shorthands/
  */
}
