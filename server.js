var express = require('express');
var handlebars = require('express-handlebars');
var bodyParser = require('body-parser');
var path = require('path');
var mysql = require('./myODdb.js');
var expressValidator = require('express-validator');
var session = require('express-session');
var multer = require('multer');

var app = express();

var storage = multer.diskStorage({
  destination: './public/icon/',
  filename: function(req,file,cb){
    cb(null,file.originalname);
  }
});

var upload = multer({
  storage: storage
}).single('myImage');

var hbs = handlebars.create({
    defaultLayout:'main',
    helpers: {
        each_consoleFilter: function (list, console, keyword, opts) { 
          //console.log(arguments);
          var i, result = '';
          for(i = 0; i < list.length; ++i)
              if(list[i][console] == keyword)
                  result += opts.fn(list[i]);
          return result;
        },

        if_eq: function (a, b, opts) {
            if(a == b){
                return opts.fn(this);
            }
            else{
                return opts.inverse(this);
            }
        }
    }
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('port', 5462);

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));


//add a custom validator to check whether username exists in database
app.use(expressValidator({
    customValidators: {
        isUsernameExistsInDB(username) {
          return new Promise((resolve, reject) => {
              mysql.pool.query('SELECT COUNT(`username`) AS count FROM `Login` WHERE `username`= ?', [username] , function (error, results, fields) {
                if(error) throw error;
                //test log
                //console.log("'SELECT COUNT(`username`) AS count FROM `Login` WHERE `username`= ?'");
                //console.log(" parseInt(results[0].count) ="+parseInt(results[0].count));
                if(parseInt(results[0].count)===0){
                  resolve();
                }else{
                  reject();
                }
              });
          });
        },

/*        isPasswordCorrect(password,userId) {
          return new Promise((resolve, reject) => {
                console.log(userId);
                console.log("before query. password = "+ password);
                //console.log("before query. password = "+ password+"  customer_id = "+req.session.customerId);
              mysql.pool.query('SELECT password FROM `Login` WHERE customer_id= ?', [2] , function (error, results, fields) {
                                            console.log("in query. password = "+ password);
                if(error) throw error;
                //test log
                //console.log("'SELECT password AS count FROM `Login` WHERE id= ?'");
                //console.log(results[0].password);
                if(results[0].password==password){
                  resolve();
                }else{
                  reject();
                }
              });
          });
        }*/
    }
}));

app.use(express.static(path.join(__dirname, '/public')));
app.use(session({
  secret:'SecretEvilCat',
  resave: false,
  saveUninitialized: false
}));

const { check, validationResult } = require('express-validator/check');
const { matchedData, sanitize } = require('express-validator/filter');


/* Used code from http://johnzhang.io/options-request-in-express *
* to handle 404 options error when making post request*/
app.options("/*", function(req, res, next){
res.header('Access-Control-Allow-Origin', '*');
res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
res.header('Acess-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
res.send(200);
});


//use for changing nav bar after login 
app.use((req, res, next) => {

  // get user from cookie, database, etc.
  res.locals.userId = req.session.customerId;
  res.locals.userName = req.session.customerName;
  next();

});


//add a new game with image to table `Games`
//note that the game is launched to sell by default
app.post('/upload', function (req, res) {
  upload(req,res,(err)=>{
    if(err){
      res.write(JSON.stringify(err));
      res.end();
    }
    else{
      mysql.pool.query('INSERT INTO `Games`(`name`,`console`,`price`,`imageURL`,`selling`) VALUES (?,?,?,?,?)',[req.body.name,req.body.console,req.body.price,req.file.filename,true],function(error, results, fields) {
        if(error){
          res.write(JSON.stringify(error));
          res.end();
        }
        res.redirect('/manageGame');
      });
    }
  });

});


//change a game's selling status to true from ajax request
app.post('/sellGame',function(req,res){

  mysql.pool.query('Update `Games` SET selling = ? WHERE id = ?',[true,req.body.id],function(error,results,fields){
    if(error){
      res.write(JSON.stringify(error));
      res.end();
    }
    res.send(JSON.stringify('A game is launched to sell now!'));
  });

});

    
//change a game's selling status to false from ajax request
//also remove the game from customers' cart
app.post('/stopSellGame',function(req,res){

  mysql.pool.query('Update `Games` SET selling = ? WHERE id = ?',[false,req.body.id],function(error,results,fields){
    if(error){
      res.write(JSON.stringify(error));
      res.end();
    }
    mysql.pool.query('DELETE FROM `Cart` WHERE game_id = ?',[req.body.id],function(error,results,fields){
      if(error){
        res.write(JSON.stringify(error));
        res.end();
      }
      res.send(JSON.stringify('A game is stopped selling now!'));
    });
  });

});


//render game managment page when login as admin
app.get('/manageGame',function(req,res){
  var context = {};
  mysql.pool.query('SELECT * FROM `Games`', function(err, results, fields){
    if(err){
      next(err);
      return;
    }
    context.games = results;
    res.render('managegame',context);
  });

});


//remove a item in cart by ajax request
app.post('/removeCartItem',function(req,res){

  mysql.pool.query('DELETE FROM `Cart` WHERE id = ?',[req.body.id],function(error,results,fields){
    if(error){
      res.write(JSON.stringify(error));
      res.end();
    }
    res.send(JSON.stringify('Here is Server. Back to you'));
  });

});


//render the home page with a list of ALL games
app.get('/',function(req,res){
  var context = {};
  context.selectedConsole = "All";

  //retrieve data to prepare for dynamic poplulate list
  //get the all the console types from the games that are being to sell
  mysql.pool.query('SELECT DISTINCT console FROM `Games` WHERE selling = ? ORDER BY console',[true],function(err,results,feilds){
    if(err){
      res.write(JSON.stringify(err));
      res.end();
    }

    context.console = results;

      mysql.pool.query('SELECT * FROM `Games` WHERE selling = ? ORDER BY name',[true],function(err, results, fields){
        if(err){
          next(err);
          return;
        }
        context.games = results;
        res.render('home',context);
      });
  });

});


//render the home page with a list of FILTERED games 
app.post('/',function(req,res){
  var context = {};

  context.selectedConsole = req.body.selectedConsole;

  //retrieve data to prepare for dynamic poplulate list
  //get the all the console types from the games that are being to sell
  mysql.pool.query('SELECT DISTINCT console FROM `Games` WHERE selling = ? ORDER BY console',[true],function(err,results,feilds){
    if(err){
      res.write(JSON.stringify(err));
      res.end();
    }

    context.console = results;

      mysql.pool.query('SELECT * FROM `Games` WHERE (console = ? OR ? = "All") AND selling = ? ORDER BY name',[req.body.selectedConsole,req.body.selectedConsole,true],function(err, results, fields){
        if(err){
          next(err);
          return;
        }
        context.games = results;     
   
        res.render('home',context);
      });
  });

});


//render the sign up page
app.get('/signup',function(req,res){
  res.render('signup');
});


//process the registration
app.post('/signup',function(req,res){

  var context={};

  //use express validator to validate the inputs from form
  req.checkBody('username','Username already exists.').isUsernameExistsInDB();
  req.checkBody('username','Username cannot be empty.').notEmpty();
  req.checkBody('username','This username is invalid').not().equals('admin');
  req.checkBody('password','Password must be between 8-50').len(8,50);
  req.checkBody('reEnterPassword','Passwords do not match.').equals(req.body.password);
  req.checkBody('firstName','First name cannot be empty.').notEmpty();
  req.checkBody('lastName','Last name cannot be empty.').notEmpty();
  req.checkBody('address','Address cannot be empty.').notEmpty();

  req.asyncValidationErrors().then(() => {
    //no errors, insert user to DB
    //process registration
    //console.log("No errors. NICE!!");
    /*the inputs data will be insert into two tables one by one ,`Customers` and `Login`*/
    //first insert a new row to `Customers` and save the insert id
    mysql.pool.query('INSERT INTO `Customers`(`fname`,`lname`,`address`) VALUES (?,?,?)',[req.body.firstName,req.body.lastName,req.body.address],function(error, results, fields) {
      if(error){
        res.write(JSON.stringify(error));
        res.end();
      }

      //last insert id from `Cusomter`
      var newCustomerId = results.insertId

      //insert a new row to `Login` (note that `Login` is dependent on `Cusomters`)
      mysql.pool.query('INSERT INTO `Login`(`username`,`password`,`customer_id`) VALUES (?,?,?)',[req.body.username,req.body.password,newCustomerId],function(error, results, fields){
        if(error){
          res.write(JSON.stringify(error));
          res.end();
        }
        //assign session
        req.session.customerId = newCustomerId
        req.session.customerName = req.body.firstName
        //registration is doone. redirect to route '/'
        res.redirect('/');
      });
    });
  }).catch((errors) => {
      if(errors) {
        context.errors = errors;
        res.render('signup',context);
      };
  });

});


//render home page
app.post('/',function(req,res,next){
  if(req.body['registration']){
    req.session.name = req.body.fname;
    res.locals.user = req.body.fname
  }
  res.render('home');
});


//render the sign in page
app.get('/login',function(req,res,next){
  res.render('signin');
});


//process the login
app.post('/login',function(req,res,next){

  if(req.body.username == "admin"){ //when login as admin
    mysql.pool.query('SELECT password FROM `Admin` WHERE adminName =?',[req.body.username],function(error, results, fields){
      if(error){
        res.write(JSON.stringify(error));
        res.end();
      }

      var password = results[0].password;

      if(password == req.body.password){
        req.session.customerId = 0; //speical id when login as admin
        res.redirect('/');
      }
      else{
        res.render('signin');
      }
    });
  }
  else{ //when login as customer
    mysql.pool.query('SELECT password, customer_id, fname FROM `Login` '+ 
      'INNER JOIN `Customers` ON Login.customer_id = Customers.id WHERE username = ?',[req.body.username],function(error, results, fields){
      if(error){
        res.write(JSON.stringify(error));
        res.end();
      }

      if(results.length === 0 ){  //the case in which the username doesn't exist in DB
        res.render('signin');
      }
      else{
        var password = results[0].password;

        if(password == req.body.password){    //password matches. assign session
          req.session.customerId = results[0].customer_id
          req.session.customerName = results[0].fname;
          res.redirect('/');
        }
        else{                     //password not match
          res.render('signin');
        }
      }
    });
  }

});


//add items in home page to shopping cart
app.post('/addtocart',function(req,res){

  if(req.session.customerId==null){ //if user is not login and tries to add items to cart
    res.redirect('/login');         //redirect them to login page
    return;
  }
  

  mysql.pool.query('SELECT COUNT(`id`) AS count FROM `Cart` WHERE game_id = ? AND customer_id = ?',[req.body.gameId,req.session.customerId],function(error,results,fields){
    if(error){
      res.write(JSON.stringify(error));
      res.end();
    }
    var itemCount = results[0].count;

    if(itemCount == 0){ //the game doesn't exist in `Cart`. Insert data to `Cart` 
      //test log
      //console.log("the game doesn't exist in `Cart`");
      mysql.pool.query('INSERT INTO `Cart` (`customer_id`,`game_id`,`quantity`) VALUES (?,?,?)',
        [req.session.customerId,req.body.gameId,req.body.quantity],function(error,results,fields){
        if(error){
          res.write(JSON.stringify(error));
          res.end();
        }
        
        res.redirect('/');
      });
    }
    else{ //the game is already in cart, so just accumlate the quantity by a UPDATE query 
      //test log
      //console.log("the game is already in cart");
      mysql.pool.query('UPDATE `Cart` SET quantity=(quantity+?) WHERE game_id = ? AND customer_id = ?',[req.body.quantity,req.body.gameId,req.session.customerId],function(error,results,fields){
        if(error){
          res.write(JSON.stringify(error));
          res.end();
        }
        res.redirect('/');
      });
    }
  });
  
});


//render the shopping cart page
app.get('/cart',function(req,res){

  var context={};
  mysql.pool.query('SELECT Cart.id AS id, name, console, price, quantity, imageURL FROM `Cart` '+
    'INNER JOIN `Games` ON Cart.game_id = Games.id '+
    'WHERE Cart.customer_id = ?',[req.session.customerId],function(error,results,fields){
    if(error){
      res.write(JSON.stringify(error));
      res.end();
    }
    context.cartList = results;
    res.render('cart',context);
  });

});


//render the profile page
app.get('/profile',function(req,res){
  var context = {};
  mysql.pool.query('SELECT address FROM `Customers` WHERE id = ?',[req.session.customerId],function(error, results, fields){
    if(error){
      res.write(JSON.stringify(error));
      res.end();
    }
    context = results[0];
    res.render('profile',context);
  });
});


//render my order page
app.get('/myorder',function(req,res){
  var context = {};

  mysql.pool.query('SELECT order_id, name, console, quantity, price,quantity*price AS subtotal FROM `Orderdetails` '+
    'INNER JOIN `Orders` ON Orderdetails.order_id = Orders.id ' +
    'INNER JOIN `Games` ON Orderdetails.game_id = Games.id ' +
    'WHERE customer_id = ? '+
    'ORDER BY Orderdetails.order_id DESC, Orderdetails.id DESC',[req.session.customerId],function(error,results,fields){
      if(error){
        res.write(JSON.stringify(error));
        res.end();
      }

      context.orderDetails = results;

      mysql.pool.query('SELECT order_id, SUM( quantity*price ) AS total, date FROM `Orderdetails` '+
        'INNER JOIN `Orders` ON Orderdetails.order_id = Orders.id '+
        'INNER JOIN `Games` ON Orderdetails.game_id = Games.id '+
        'WHERE customer_id = ? ' +
        'GROUP BY order_id '+
        'ORDER BY order_id DESC',[req.session.customerId],function(error,results,fields){
        if(error){
          res.write(JSON.stringify(error));
          res.end();
        }   

        context.orders = results;
        res.render('myorder',context);
      });

  });

});


//update address
app.post('/updateAddress',function(req,res){

  var context={};

  //use express validator to validate the inputs from form
  req.checkBody('address','Address cannot be empty.').notEmpty();

  var addressError = req.validationErrors();

  if(addressError){
    context.addressError = addressError;
    context.oldaddress = req.body.oldAddress  //show the address in <input> again 
    res.render('profile',context);
  }
  else{
    mysql.pool.query('UPDATE `Customers` SET address=? WHERE id = ?',[req.body.address,req.session.customerId],function(error,results,fields){
      if(error){
        res.write(JSON.stringify(error));
        res.end();
      }

      res.redirect('/');
    });
  }

});


//render the change password page
app.get('/changePassword',function(req,res){
  res.render('changepassword');
});


//process the password change request
app.post('/changePassword',function(req,res){

  var context={};
  var passwordError = [];

  req.checkBody('newPassword','New password must be between 8-50').len(8,50);
  req.checkBody('reEnterNewPassword','New passwords do not match.').equals(req.body.newPassword);

  if (req.validationErrors())
    passwordError = req.validationErrors();
  else
    passwordError = [];

  mysql.pool.query('SELECT password FROM `Login` WHERE customer_id= ?', [req.session.customerId] , function (error, results, fields) {
    if(error){
      res.write(JSON.stringify(error));
      res.end();
    }

    //customize a current password validation
    //if password does not match the one in DB, add an error msg to passwordError
    if(results[0].password!=req.body.oldPassword){
      passwordError.push({"msg":"Current password is not correct."});  
    }

    if(passwordError.length>0){
      context.passwordError = passwordError;
      res.render('changepassword',context)
    }else{
      mysql.pool.query('UPDATE `Login` set password= ? WHERE customer_id = ?', [req.body.newPassword,req.session.customerId] , function (error, results, fields){
        if(error){
          res.write(JSON.stringify(error));
          res.end();
        }
        res.redirect('/');
      });
    }
  });

});

/*
app.post('/removeCartItem',function(req,res){
  mysql.pool.query('DELETE FROM `Cart` WHERE id = ?',[req.body.id],function(error,results,fields){
    if(error){
      res.write(JSON.stringify(error));
      res.end();
    }
    res.send(JSON.stringify('Here is Server. Back to you'));
  });
});*/


//update the item's quantity in cart from ajax request
app.post('/updateCartQuantity',function(req,res){

  if(req.session.customerId==null){
    next();         
    return;
  }
  
  mysql.pool.query('UPDATE `Cart` SET quantity=? WHERE id = ? AND customer_id',[req.body.newQuantity, req.body.id,req.session.customerId],function(error,results,fields){
    if(error){
      res.write(JSON.stringify(error));
      res.end();
    }

    res.send(JSON.stringify('Update is done by server.'));
  });
  
});


//process checkout
app.post('/checkout',function(req,res){

  var date;
  date = new Date();
  date = date.getUTCFullYear() + '-' +
      ('00' + (date.getUTCMonth()+1)).slice(-2) + '-' +
      ('00' + date.getUTCDate()).slice(-2) + ' ' + 
      ('00' + date.getUTCHours()).slice(-2) + ':' + 
      ('00' + date.getUTCMinutes()).slice(-2) + ':' + 
      ('00' + date.getUTCSeconds()).slice(-2);

  mysql.pool.query('INSERT INTO `Orders` (`customer_id`,`date`) VALUES (?,?)',[req.session.customerId,date],function(error,results,fields){
    if(error){
      res.write(JSON.stringify(error));
      res.end();
    }

    var orderId = results.insertId
    //test log
    //console.log("orderId = "+orderId);

    mysql.pool.query('SELECT game_id, quantity FROM `Cart` WHERE customer_id= ?', [req.session.customerId] , function (error, results, fields) {
      if(error){
        res.write(JSON.stringify(error));
        res.end();
      }

      var orderDetailsValues="";

      for(var i = 0;i<results.length;i++){
        orderDetailsValues = orderDetailsValues + '('+orderId+','+results[i].game_id+','+results[i].quantity+')'+',';
      }

      //get rid of the last commas char
      orderDetailsValues = orderDetailsValues.slice(0,-1);

      mysql.pool.query('INSERT INTO `Orderdetails` (`order_id`,`game_id`,`quantity`) VALUES' + orderDetailsValues,function(error,results,fields){
        if(error){
          res.write(JSON.stringify(error));
          res.end();
        }


        mysql.pool.query('DELETE FROM `Cart` WHERE customer_id = ?',[req.session.customerId],function(error,results,fields){
          if(error){
            res.write(JSON.stringify(error));
            res.end();
          }
          res.send(JSON.stringify('checkout is done by server.'));
        });
      });
    });
  });


});


app.get('/logout',function(req,res,next){

  if(req.session.customerId==null){
    next();
  }
  else{
  req.session.destroy();
  res.redirect('/');
  }

});


app.use(function(req,res){

  res.status(404);
  res.render('404');

});


app.use(function(err, req, res, next){

  console.error(err.stack);
  res.type('plain/text');
  res.status(500);
  res.render('500');

});


app.listen(app.get('port'), function(){

  console.log('Express started on port :' + app.get('port') + '; press Ctrl-C to terminate.');

});
