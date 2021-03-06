var React = require('react');
var ReactDOM = require('react-dom');
var Slider = require('rc-slider');
var Guest = require('./guest.jsx');
var request = require('superagent');

var text = [
  'Not very fancy.  Remember that you should wear shoes',
  'Neither fancy nor unfancy.',
  'Pretty fancy.  You appreciate the finer things in life.',
  'Extremely fancy.',
  'Liberace'
];

var questions = [
  {
    q : 'Please write a short 5000 word essay on why you\'d like to attend this event.',
    a : [
      '5000 words?  That\'s way too long.  Listen, asking me to go all the way to Southern Oregon is more than enough.',
      "WELL, PRINCE, Genoa and Lucca are now no more than private estates of the Bonaparte family. No, I warn you, that if you do not tell me we are at war, if you again allow yourself to palliate all the infamies and atrocities of this Antichrist (upon my word, I believe he is), I don't know you in future, you are no longer my friend, no longer my faithful slave, as you say. There, how do you do, how do you do? I see I'm scaring you, sit down and talk to me.",
      'Chapter 1 \r\n\r\nThe sky above the port was the color of television, tuned to a dead channel. \r\n\r\n\"It\'s not like I\'m using,\" Case heard someone say, as he shouldered his way through the crowd around the door of the Chat. \"It\'s like my body\'s developed this massive drug deficiency.\" It was a Sprawl voice and a Sprawl joke. The Chatsubo was a bar for professional expatriates; you could drink there for a week and never hear two words in Japanese.',
      '\"I\'ve watched through his eyes, I\'ve listened through his ears, and I tell you he\'s the one. Or at least as close as we\'re going to get.\" \r\n\"That\'s what you said about the brother.\" \r\n\"The brother tested out impossible. For other reasons. Nothing to do with his ability.\" \r\n\"Same with the sister. And there are doubts about him. He\'s too malleable. Too willing to submerge himself in someone else\'s will.\" \r\n\"Not if the other person is his enemy.\"',
    ]
  },
  {
    q : 'Any special partying restrictions?',
    a : [
      'No, I am prepared to meet this party head-on.',
      'No, although I might need to be done before 4am.',
      'I need to make it home early so I can catch up on House of Cards'
    ]
  },
  {
    q : 'I won\'t have fun unless:',
    a : [
      'There is a bouncy castle',
      'Everyone promises not to take pictures',
      'The ceremony is 4 minutes or less'
    ]
  },
  {
    q : 'Favorite Real Housewives series:',
    a : [
      'Real Housewives of Atlanta',
      'Real Housewives of New Jersey',
      'Real Housewives of Antarctica',
      'Real Housewives of Space Station Mir'
    ]
  },
  {
    q : 'What\'s the deal with Lebron this year?',
    a : [
      'Sorry, I don\'t follow sports',
      'Who?',
      "Listen kid, I've been hearing that crap ever since I was at UCLA. I'm out there busting my buns every night! Tell your old man to drag Walton and Lanier up and down the court for 48 minutes!"
    ]
  },
  {
    q : 'Favorite Julia Roberts role:',
    a : [
      'Pretty woman, obviously.  Although, there are just so many good ones...',
      'Runaway Bride.  Ha, just kidding!',
      'Oceans 11 is the only one I\'ve seen',
      'Twister.  Wait, that was Helen Hunt'
    ]
  },
];

// Shuffle answers
for (var i in questions){
  questions[i].a = shuffle(questions[i].a);
}

// Shuffle questions
var shuffled = shuffle(questions);

var invitation = {
  id : 123,
  people : []
};

var Rsvp = React.createClass({
  getInitialState : function(){
    this.backup = JSON.stringify(invitation);
    return {
      invitation : invitation,
      id : this.props.params && this.props.params.id ? this.props.params.id.toUpperCase() : false
    };
  },
  navWarning: function(e){
    if (this.state.isDirty){
      var str = 'It looks like you haven\'t submitted your RSVP yet!  Are you sure you want to leave?';
      e.returnValue = str;
      return str;
    } else {
      return null;
    }
  },
  componentWillUnmount : function(){
    window.onbeforeunload = null;
  },
  componentDidMount : function(stuff){

    // Make sure people don't accidentally navigate away
    window.onbeforeunload = this.navWarning;

    var id = this.state.id;
    if (id){
      id = id.toUpperCase();
      request
        .get('/api/invitation/' + id)
        .end(function(err, res){
          var d = res.body || {};

          var people = [];

          if (exists(d['Invitee 1'])){
            people.push({
              name : d['Invitee 1'],
              email : d['Email 1']
            });
          } else {
            var error = <div>
              <p>We can't find this code. Don't worry, you're still invited!
              <br />You can still <a href="#" onClick={this.addNew}>add your name</a> without one.
              </p>
            </div>
            this.setState({
              error : error,
              id : 'Unknown'
            });
          }

          if (exists(d['Invitee 2'])){
            people.push({
              name : d['Invitee 2'],
              email : d['Email 2']
            });
          }

          if (exists(d['Invitee 3'])){
            people.push({
              name : d['Invitee 3'],
              email : d['Email 3']
            });
          }

          if (exists(d['Invitee 4'])){
            people.push({
              name : d['Invitee 4'],
              email : d['Email 4']
            });
          }

          function exists(entry){
             return (typeof entry === 'string' ? entry : false);
          }

          // If we already have a response, show it
          if (d.response){
            this.setState({ finished : true });
          }

          // Update onscreen invitation
          var invitation = this.state.invitation;
          invitation.people = people;
          this.setState({ invitation : invitation });
          this.backup = JSON.stringify(invitation);
          this.render();

        }.bind(this));
    }
    this.updateAlignment();
  },
  finish : function(){

    var id = this.state.id || 'Unknown';

    var setState = this.setState.bind(this);

    // Validate
    var pass = true;
    var people = this.state.invitation.people;
    for (var i in people){
      var person = people[i];
      if (!person.or || !person.hi){
        pass = false;
      }
    }

    if (pass){
      request
        .post('/api/invitation/' + id)
        .send(this.state.invitation)
        .set('Accept', 'application/json')
        .end(function(){
          setState({ finished : true });
        }.bind(this));

      setState({ isDirty: false });

      if (window.ga){
        window.ga('send', 'event', 'RSVP', 'Success');
      }
    } else {
      setState({ error : "Please make sure to accept or decline each event." });
      if (window.ga){
        window.ga('send', 'event', 'RSVP', 'Fail');
      }
    }
  },
  addNew : function(e){

    if (e && e.preventDefault){
      e.preventDefault();
    }

    var invitation = this.state.invitation;

    invitation.people.push({
      name : 'Surprise guest!'
    });

    var id = this.state.id ? this.state.id : 'Unknown';

    invitation.id = id

    this.setState({
      invitation: invitation,
      error:      false,
      id:         id,
      focus:      invitation.people.length == 1 ? 1 : 0,
    });
    this.forceUpdate();
  },
  startOver : function(e){
    e.preventDefault();
    var id = this.state.id;
    this.setState({ isDirty: false });
    request
      .del('/api/invitation/' + id)
      .set('Accept', 'application/json')
      .end(function(){
        this.setState({ finished : false });
      }.bind(this));
  },
  showGuests : function(){

    var people = this.state.invitation.people;

    if (!this.state.id){
      return (
        <div className="nonames">
          <p>Your R.S.V.P. code can be found on your Save the Date.</p>
          <p>wedding.farm/rsvp/<span style={{ color : '#7d5a00' }}>CODE</span></p>
          <p>If we goofed and you never got yours, don't worry.
          <br />You can still <a href="#" onClick={this.addNew}>add your name</a> without one.</p>
        </div>
      )
    } else {

      var arr = people.map(function(d, i){

        var question = shuffled[(i+1) % shuffled.length],
            answer = question.a[0],
            update = function(person, restore, save){

              // Restore backup
              if (restore){
                this.setState({ invitation : JSON.parse(this.backup) });
              } else {

                // Update person
                var invitation = this.state.invitation;

                if (person.answer){
                  person.question = question.q;
                }
                invitation.people[i] = person;
                this.setState({
                  invitation : invitation,
                  isDirty : true
                });

                if (save){
                  this.backup = JSON.stringify(invitation);
                }
              }

            }.bind(this),
            changeFocus = function(i, e){
              e.preventDefault();
              this.setState({
                focus : this.state.focus == i+1 ? 0 : i+1,
                error : false
              });
            };

        return (
          <Guest
            person      = {d}
            backup      = {d}
            update      = {update}
            question    = {question.q}
            answer      = {answer}
            index       = {i}
            key         = {'guest-' + i}
            focused     = {this.state.focus && this.state.focus == i+1}
            hide        = {this.state.focus}
            changeFocus = {changeFocus.bind(this, i)}
          />
        )
      }.bind(this));

      return arr;
    }
  },
  componentDidUpdate : function(){
    this.updateAlignment();
  },
  updateAlignment : function(){
    if (!this.timeout){
      var viewport = window.innerHeight - 100;
      var element = document.getElementById('form').offsetHeight;
      this.timeout = setTimeout(function(){
        this.timeout = false;
      }.bind(this), 1000);
      this.setState({
        centered: viewport > element
      });
    }
  },
  render : function(){
    var message = this.state.id && this.state.id !== 'Unknown' ? "Did we forget someone?" : "⊕ Add a name to the list";

    var finish = function(){
      if (this.state.id && this.state.invitation.people.length){
        return (
          <div className={"row animated " + (this.state.focus ? ' fadeout' : '')}>
            <div className="col-md-4"></div>
            <div className="col-md-5">
              <div className="add-person pull-left" onClick={this.addNew}>
                { message }
              </div>
              <button name="singlebutton" className="btn btn-primary btn-lg pull-right" onClick={this.finish}>Finish</button>
            </div>
          </div>
        )
      }
    }.bind(this);

    var showError = function(){
      if (this.state.error){
        return (
          <div className={"row animated " + (this.state.focus ? ' fadeout' : '')}>
            <div className={"animated error " + (this.state.error ? '' : ' fadeout')} style={{ 'textAlign' : 'center', 'margin' : '20px 0'}}>
              {this.state.error}
              <hr />
            </div>
          </div>
         )
      }
    }.bind(this);

    var showTitle = function(){
      if (this.state.id && this.state.invitation.people.length){
        return (
          <div className={"row animated" + (this.state.focus ? ' fadeout' : '')} style={{ 'textAlign' : 'center' }}>
            <h2>Répondez, s'il vous plaît.</h2>
            <hr />
          </div>
        );
      }

    }.bind(this);

    return (
      <div className={'page' + (this.state.centered ? ' centered' : ' overflowing') }>
        <div id="form" className={"container animated " + (this.state.finished ? ' fadeout' : '')}>
          {showTitle()}
          <form className="form-horizontal rsvp">
            <fieldset>
              {this.showGuests()}
            </fieldset>
          </form>
          <hr />
          {showError()}
          {finish()}
        </div>
        <div className={"alldone animated " + (this.state.finished ? '' : ' fadeout')}>
          <h2>All done</h2>
          <p>Thank you for submitting your R.S.V.P.</p>
          <p>If your plans change, you can <a onClick={this.startOver} href="#">start over</a> or<br />
          let us know at rsvp@wedding.farm.</p>
        </div>
      </div>
    )
  }
});

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

module.exports = Rsvp;
