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

function days_hours_minutes_seconds( t, fmt )
{
  var d=0, h=0, m=0, s=0;
  fmt = fmt || {days:true, hours:true, minutes:true, seconds:true};
  if ( fmt.days ) d = (t/DAY)|0; t -= d*DAY;
  if ( fmt.hours ) h = (t/HOUR)|0; t -= h*HOUR;
  if ( fmt.minutes ) m = (t/MINUTE)|0; t -= m*MINUTE;
  if ( fmt.seconds ) s = t|0;
  return {d:d, h:h, m:m, s:s};
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
    
    ,extend: function( duration ) {
        var self = this;
        if ( self.timer )
        {
            self.duration += duration|0;
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
    
    ,getTime: function( fmt ) {
        return days_hours_minutes_seconds( this.time, fmt );
    }
};

var fmt_re = /%([^%]+)%/g;

$.Timer = function( el, options ) {
    var self = this, $el = $(el), fmt, dfmt;
    options = options || {};
    var format = $el.attr('data-timer-format') || options.format || '%dd%:%hh%:%mm%:%ss%';
    var type = $el.attr('data-timer-type') || options.type || 'down';
    var duration = parseInt($el.attr('data-timer-duration'),10) || options.duration || 0;
    var granularity = parseInt($el.attr('data-timer-granularity'),10) || options.granularity || 1;
    
    fmt = format;
    
    $.data( el, 'Timer', self );
    
    if ( 'function' !== typeof fmt )
    {
        dfmt = {days:false, hours:false, minutes:false, seconds:false};
        fmt.replace(fmt_re, function(g0, g1){
            if ( 'dd' === g1 || 'd' === g1 ) dfmt.days = true;
            else if ( 'hh' === g1 || 'h' === g1 ) dfmt.hours = true;
            else if ( 'mm' === g1 || 'm' === g1 ) dfmt.minutes = true;
            else if ( 'ss' === g1 || 's' === g1 ) dfmt.seconds = true;
            return g0;
        });
        var prop = $el.is('input,textarea') ? 'val' : 'html';
        fmt = function( $el, timer ) {
            var t = timer.getTime( dfmt );
            $el[prop](format.replace(fmt_re, function( g0, g1 ){
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
    self.tick = new Timer( type, duration, granularity, function( timer ){
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