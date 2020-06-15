//npm files
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");


const app = express();

app.set('view engine', 'ejs'); //to use ejs in your app
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static("public")); //include static files like custom css and images

mongoose.connect('mongodb+srv://root:root@cluster0-2rgfr.mongodb.net/todolistDB', { useNewUrlParser: true ,useUnifiedTopology: true}); //mongoose connection

//database schema 
var itemsSchema  = new mongoose.Schema({
    name: String
  });

  //model for the itemSchema(table)
  const Item =mongoose.model("Item", itemsSchema);

  //mongoose document
  const item1 = new Item({
      name: "Welcome to your todolist"
  });

  const item2 = new Item({
    name: "Hit the + button to add new item"
});

const item3 = new Item({
    name: "<-- Hit this to delete an item"
});

const defaultItems = [item1,item2,item3];

//Schema for list
const listSchema = {
    name: String,
    items:[itemsSchema]
};

let today = new Date();
    let day = ""

    let options = {
        weekday: "long",
        day: "numeric",
        month: "long"
    };
    day = today.toLocaleDateString("en-US",options);

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res){
    //find all items in the database
    Item.find({}, function(error, foundItems){
        if(foundItems.length === 0){
        //insert documents into our model
        Item.insertMany(defaultItems, function(error) {
         if(error){
            console.log(error);
        }else{
        console.log("Successfully saved items to DB");
    }
});
        res.redirect("/");
        }else{
            res.render("list", {listTitle: day, newListItems:foundItems});
        }
        
    });
});


app.post("/",function(req,res){
//getting  to do item from user and saving in database
    let itemName = req.body.newItem;
    let listName = req.body.list;
    const item = new Item({
        name:itemName
    });
    if(listName === day){
        item.save();
        res.redirect("/");
    }
    else{
        List.findOne({name: listName},function(error, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        })
    }
   
});

app.post("/delete", function(req,res){
    //get checked item and delete item from database
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if(listName === day){
        Item.findByIdAndRemove(checkedItemId, function(error){
            if(!error){
                console.log("Successfully deleted");
                res.redirect("/");
            }
        });
    }
    else{
        //find listname, delete and update based on listname
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(error,foundList){
            if(!error){
                res.redirect("/" + listName);
            } 
        });
    }
    
});

//creating a custom list 
app.get("/:customListName", function(req,res){
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({name: customListName},function(error,foundList){
        if(!error){
            if(!foundList){
                //create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName );
            }
            else{
                //show an existing list
                res.render("list", {listTitle: foundList.name, newListItems:foundList.items});
            }
        }
    });
   
});

app.listen(3000, function(){
    console.log("App running on port 3000");
});