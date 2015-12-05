/**
*
* CountDown Timer Widget
* https://github.com/foo123/Timer
*
* adapted from: http://stackoverflow.com/a/20618517/3591273
*/
!function($, undef) {
"use strict";

var MINUTE = 60, HOUR = 60*MINUTE, DAY = 24*HOUR,
    NOW = Date.now ? Date.now : function( ){ return new Date( ).getTime( ); },
    fmt_re = /%([^%]+)%/g
;

function days_hours_minutes_seconds( t )
{
  var d, h, m;
  d = (t/DAY)|0; t -= d*DAY;
  h = (t/HOUR)|0; t -= h*HOUR;
  m = (t/MINUTE)|0; t -= m*MINUTE;
  return {d: d, h: h, m: m, s: t|0};
}
function create_timer( timer )
{
    timer.started = NOW( );
    return 'up' === timer.type
    ? function timer_tick( ){
        if ( !timer.running ) return; // stopped
        timer.time = ((NOW( )-timer.started) / 1000) | 0;

        if ( timer.duration > timer.time )
        {
            setTimeout( timer_tick, timer.granularity );
        }
        else
        {
            timer.time = timer.duration;
            timer.running = false;
        }
        timer.tick && timer.tick( timer );
    }
    : function timer_tick( ){
        if ( !timer.running ) return; // stopped
        timer.time = timer.duration - ( ((NOW( )-timer.started) / 1000) | 0 );

        if ( 0 < timer.time )
        {
            setTimeout( timer_tick, timer.granularity );
        }
        else
        {
            timer.time = 0;
            timer.running = false;
        }
        timer.tick && timer.tick( timer );
    };
}

// adapted from: http://stackoverflow.com/a/20618517/3591273
function Timer( type, duration, granularity, tick )
{
    var self = this;
    self.type = type;
    self.duration = duration;
    self.granularity = (granularity || 1)*1000;
    self.started = 0;
    self.time = 0;
    self.tick = tick;
    self.running = false;
}

Timer.parse = days_hours_minutes_seconds;

Timer.prototype = {
    constructor: Timer
    
    ,running: false
    ,type: 'down'
    ,started: 0
    ,duration: 0
    ,time: 0
    ,granularity: 1000
    ,timer: null
    ,tick: null
    
    ,dispose: function( ) {
        var self = this;
        self.type = null;
        self.duration = null;
        self.granularity = null;
        self.started = null;
        self.time = null;
        self.timer = null;
        self.tick = null;
        self.running = false;
        return self;
    }
    
    ,start: function( ) {
        var self = this;
        if ( !self.running )
        {
            self.timer = create_timer( self );
            self.running = true;
            self.timer( );
        }
        return self;
    }

    ,stop: function( ) {
        var self = this;
        self.running = false;
        return self;
    }
    
    ,resume: function( ) {
        var self = this;
        if ( self.timer && !self.running )
        {
            self.running = true;
            self.timer( );
        }
        return self;
    }
    
    ,reset: function( duration ) {
        var self = this;
        if ( self.timer )
        {
            if ( arguments.length ) self.duration = duration|0;
            self.started = NOW( );
            if ( !self.running )
            {
                self.running = true;
                self.timer( );
            }
        }
        return self;
    }
    
    ,getTime: function( ) {
        return days_hours_minutes_seconds( this.time );
    }
};

var fmt_re = /%([^%]+)%/g;

$.Timer = function( el, options ) {
    var self = this, $el = $(el), fmt;
    options = $.extend({
        'format': $el.attr('data-timer-format') || '%dd%:%hh%:%mm%:%ss%',
        'type': $el.attr('data-timer-type') || 'down',
        'duration': parseInt($el.attr('data-timer-duration'),10) || 10,
        'granularity': parseInt($el.attr('data-timer-granularity'),10) || 1
    }, options||{});
    
    fmt = options.format;
    
    $.data( el, 'Timer', self );
    
    if ( 'function' !== typeof fmt )
    {
        fmt = function( $el, timer ) {
            var t = timer.getTime( );
            $el.html(options.format.replace(fmt_re, function( g0, g1 ){
                if ( 'dd' === g1 ) return 10 > t.d ? '0'+t.d : t.d;
                else if ( 'd' === g1 ) return t.d;
                else if ( 'hh' === g1 ) return 10 > t.h ? '0'+t.h : t.h;
                else if ( 'h' === g1 ) return t.h;
                else if ( 'mm' === g1 ) return 10 > t.m ? '0'+t.m : t.m;
                else if ( 'm' === g1 ) return t.m;
                else if ( 'ss' === g1 ) return 10 > t.s ? '0'+t.s : t.s;
                else if ( 's' === g1 ) return t.s;
                return g0;
            }));
        };
    }
    self.dispose = function( ) {
        self.tick.dispose( );
        self.tick = null;
        $.removeData( el, 'Timer' );
    };
    self.tick = new Timer( options.type, options.duration, options.granularity, function( timer ){
        fmt( $el, timer );
        $el.trigger(timer.running ? 'timer-tick' : 'timer-finished');
    });
    if ( false !== options.autoStart ) self.tick.start( );
};

$.fn.Timer = function( options ) {
    var args = arguments;
    var return_value = this;
    this.each(function( ){
        var el = this, timer = $.data( el, 'Timer' );
        if ( !timer )
        {
            new $.Timer( el, options );
        }
        else if ( 'dispose' === options )
        {
            timer.dispose( );
        }
        else if ( 'start' === options )
        {
            timer.tick.start( );
        }
        else if ( 'stop' === options )
        {
            timer.tick.stop( );
        }
        else if ( 'resume' === options )
        {
            timer.tick.resume( );
        }
        else if ( 'reset' === options )
        {
            args.length > 1 ? timer.tick.reset( args[1] ) : timer.tick.reset( );
        }
        else if ( 'value' === options || 'time' === options )
        {
            // get value
            return_value = timer.tick.getTime( );
            return false;
        }
    });
    return return_value;
};

}(jQuery);