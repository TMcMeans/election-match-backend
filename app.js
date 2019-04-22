var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
const fetch = require('node-fetch');

var indexRouter = require('./routes/index');

var app = express();
app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Post ocd_id to proxy server
app.post('/api/search', (req, res) => {
  app.locals.ocd_id = req.body.ocd_id;
  console.log(app.locals);
  // res.sendStatus(202);
  res.end();
});

//Use proxy server to make external GET request to DemWorks API and send returned data back
app.get('/api/elections/:ocd_id', async (req, res) => {
  try {
    const url = `https://api.turbovote.org/elections/upcoming?district-divisions=${encodeURIComponent(
      req.params.ocd_id
    )}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    });

    const data = await response.json();
    res.send(data);
  } catch (error) {
    console.log(error);
  }
  res.end();
});

const returnOCD_IDs = data => {
  let divisions = Object.keys(data.divisions);
  divisions.forEach(ocd_id => {
    let aka = data.divisions[ocd_id].alsoKnownAs;
    if (aka) {
      divisions = [...divisions, ...aka];
    }
  });

  return divisions;
};

app.get('/api/ocd_id/:address', async (req, res) => {
  const api_key = 'AIzaSyBUzALt9JiIgS3sJPgUwEP__B16u0Gglus';
  const encodedAddress = encodeURIComponent(req.params.address);
  const url = `https://www.googleapis.com/civicinfo/v2/representatives?address=${encodedAddress}&key=${api_key}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    res.send(returnOCD_IDs(data));
  } catch (error) {
    console.log(error);
  }
  res.end();
});

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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

//listen on port 5000
app.listen(app.get('port'), () => {
  console.log(`Server is running on ${app.get('port')}`);
});

module.exports = app;
