//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set('strictQuery',false);
mongoose.connect("mongodb+srv://AyushSachan:Ayush703a@cluster0.awnjavi.mongodb.net/todolistDB");

const itemsSchema = {
    name:String
};

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
   name:"Welcome to your todolist!"
});

const item2 = new Item({
  name:"Hit the + button to add a new item."
});

const item3 = new Item({
  name:"<--Hit ths to delete an item."
});

const defaultItems = [item1,item2,item3];

const listSchema={
  name:String,
  items:[itemsSchema]
};

const List=mongoose.model("List",listSchema);

app.get("/", function(req, res) {
  Item.find()
    .then(foundItems => {
      if (foundItems.length === 0) {
        return Item.insertMany(defaultItems);
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
        return;  // Add return here
      }
    })
    .then(() => {
      // Remove the unnecessary redirect here
    })
    .catch(err => {
      console.log(err);
      res.status(500).send("Internal Server Error"); // Sending an error response
    });
});



app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then(foundList => {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        return list.save().then(() => list); // Return the list after saving
      } else {
        return foundList; // Return the foundList
      }
    })
    .then(list => {
      res.render("list", { listTitle: list.name, newListItems: list.items });
      // Note: res.render() sends the response, so we don't call res.redirect() afterwards
    })
    .catch(err => {
      console.log(err);
      // Handle the error appropriately
      res.status(500).send("Internal Server Error"); // Example error handling
    });
});


app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save().then(() => {
      res.redirect("/");
    });
  } else {
    List.findOne({ name: listName })
      .then(foundList => {
        foundList.items.push(item);
        return foundList.save();
      })
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch(err => {
        console.log(err);
      });
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(() => {
        console.log("Successfully deleted checked item!");
        res.redirect("/");
      })
      .catch(err => {
        console.log(err);
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch(err => {
        console.log(err);
      });
  }
});



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000,function(){
  console.log("Server started");
});
