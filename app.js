var express    = require("express"),
    app        = express(),
    bodyparser = require("body-parser"),
    mongoose   = require("mongoose"),
    methodOverride = require("method-override"),
    flash       = require("connect-flash");


mongoose.connect(process.env.DATABASEURL || "mongodb://localhost/Codejunkie++");
app.use(bodyparser.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

//Imp variables
var marks = 4;
var total_time = 5;//minutes
var num_ques = [0, 0, 0];
var next_ques;
var time_dif;
var obj = {};
// SCHEMA SETUP
var questionSchema = new mongoose.Schema({
   q: String,
   correctAnswer:Number,
   options: [String],
   set_num:Number,
   i:Number
});
var UserSchema = new mongoose.Schema({
   answers:[Number],
   token:String,
   score:Number,
   name:String,
   time_start:Number,
   set_num:Number,
   phone_num:Number,
   id:{
    		type:mongoose.Schema.Types.ObjectId,
    		ref:"Question"
    	}
});
var Question = mongoose.model("Question", questionSchema);
var Users = mongoose.model("Users", UserSchema);

//Routes
app.get("/", function(req, res) {
   res.render("login"); 
});


app.post("/", function(req, res) {
   Users.create(req.body.user, function(err, user){
       if(err)
        console.log("errr");
        else{
            user.score = 0;
            var temp = [];
            for( var i =0 ;i < num_ques;i++){
                temp[i] = -1;
            }
            obj[user._id] = temp;
            user.set_num = req.body.set;
            
            var seconds = new Date().getTime() / 1000;
           user.time_start = seconds;
            user.save();
            res.redirect("/quiz/"+req.body.set + "/0/" + user._id);
        }
   }); 
});









//Show one question
app.get("/quiz/:set/:num/:user_id", function(req, res) {
    Question.find({set_num:req.params.set}, function(err, allQuestions) {
        if(err)
        console.log(err);
        else{
            allQuestions.sort(function(a, b){
             return a.i - b.i; 
          });
            Users.findById(req.params.user_id, function(err, user){
                time_dif =  total_time * 60 - parseInt( new Date().getTime() / 1000 - user.time_start);
                user.answers = obj[user._id];
                console.log("num_ques = =" + num_ques);
                res.render("ques", {question:allQuestions[req.params.num], num: req.params.num, num_ques:num_ques[user.set_num - 1],user:user, set_num:req.params.set, time:time_dif});
                
            });
            
        }
    }) 
});

app.post("/quiz/:set/:num/:user_id", function(req, res) {
    Users.findById(req.params.user_id, function(err, user){
       if(err)
        console.log(err);
       else{
           if(parseInt(req.body.btn) === (num_ques[user.set_num - 1] + 1)){
               var ques = parseInt(req.params.num) + 1;
               if(ques == num_ques[user.set_num - 1]){
                ques = 0;
               }
              next_ques =  ques;
           }
           else{
             console.log(num_ques[user.set_num - 1]);

               next_ques = req.body.btn;
           }
          console.log(req.body.btn);
            if(!isNaN(req.body.options))
            obj[req.params.user_id][req.params.num] = parseInt(req.body.options);
           if(parseInt(req.body.finish) == 1 || req.body.btn == undefined)
           {
               user.answers = obj[req.params.user_id];
              user.save();
               res.redirect("/finish/" + req.params.set + "/"+ req.params.user_id);
           }
           else{
             res.redirect("/quiz/" + req.params.set +"/"+next_ques + "/" + req.params.user_id);
           
               
           }
               
           }
    });
});
app.get("/finish/:set/:user_id", function(req, res) {
    
  Question.find({set_num:req.params.set}, function(err, allQuestions) {
      if(err)
      console.log(err);
      else{
          allQuestions.sort(function(a, b){
             return a.i - b.i; 
          });
         Users.findById(req.params.user_id, function(err, user) {
             if(err)
                 console.log(err);
           
            console.log(user);
            console.log("final obj");
            console.log(obj);
            for(var j=0;j < num_ques;j++){
            if(user.answers[j] == allQuestions[j].correctAnswer){
                user.score = user.score + marks;
            }
        } 
        user.save();
        res.send(user.name + " ,your score = " +user.score);
         }); 
      }
  }); 
});


//INDEX - show all questions
app.get("/quiz", function(req, res){
    // Get all questions from DB
    Question.find({}, function(err, allQuestions){
       if(err){
           console.log(err);
       } else {
          res.render("index",{questions:allQuestions});
       }
    });
});



app.get("/add", function(req, res){
    res.render("add", {set_num:1}); 
});

app.post("/add", function(req, res){
   Question.create(req.body.question, function(err, newQuestion){
      if(err)
        res.send("error");
      else{
          newQuestion.correctAnswer = req.body.correct;
          newQuestion.set_num = req.body.set;
          newQuestion.i = num_ques[req.body.set - 1];
          newQuestion.save();
          num_ques[req.body.set - 1]++;
          res.render("add", {set_num:req.body.set});
      }
   });
});






//Delete
app.get("/delete", function(req, res){
    Question.find({}, function(err, allQuestions){
       if(err){
           console.log(err);
       } else {
          res.render("delete",{questions:allQuestions});
       }
    });
});
app.delete("/quiz/:id", function(req,res){
    Question.findByIdAndRemove(req.params.id, function(err, deleted){
       if(err)
        res.send("errorororo");
        else{
            res.redirect("/quiz");
        }
    });
});
app.get("/result", function(req, res) {
   Users.find({}, function(err, allUsers){
     if(err)
        console.log(err);
    else{
        var set1 = allUsers.filter(function(a){
            return a.set_num == 1;
        });
 
        var set2 = allUsers.filter(function(a){
            return a.set_num == 2;
        });

        var set3 = allUsers.filter(function(a){
            return a.set_num == 3;
        });
        set1.sort(function(a, b){
            return b.score - a.score; 
        });set2.sort(function(a, b){
            return b.score - a.score; 
        });set3.sort(function(a, b){
            return b.score - a.score; 
        });
        res.render("results", {set1:set1,set2:set2,set3:set3});
        
    }
   });
});
  
app.listen(3000, function(){
   console.log("Codejunkie++ Server has started"); 
});