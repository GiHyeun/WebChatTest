var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// view engine setup
app.set('views', path.join(__dirname, 'views'));

app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

var rooms=[];

//connect 됐을때 socket에 연결 정보 저장
io.on('connection', function(socket){
    console.log('a user connected');

    socket.on('joinroom',function(data){
        var room = data.room;
        var nickname = socket.request.connection.remoteAddress;
        socket.join(data.room);

        socket.room = room;
        socket.nickname = nickname;
        // Create Room
        if (rooms[room] == undefined) {
            console.log('room create :' + room);
            rooms[room] = new Object();
            rooms[room].socket_ids = new Object();
        }
        // Store current user's nickname and socket.id to MAP
        rooms[room].socket_ids[nickname] = socket.id

        // broad cast join message
        data = {msg: ""};
        io.sockets.in(room).emit('chat message', nickname + " 님이 "+room+"에 입장하셨습니다.");
    });

    //chat message 이벤트 발생시 콘솔 출력
    socket.on('chat message', function(msg){
        data = {msg : ""};
        io.sockets.in(socket.room).emit('chat message', socket.request.connection.remoteAddress + " : " +msg);
    });

    //연결된 socket이 disconnect 됐을때
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
});

http.listen(8080, function(){
    console.log('listening on *:8080');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
