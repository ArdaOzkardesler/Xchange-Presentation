//TODO - function that gets the currency from internet

function syncDB(){}

//TODO - this will display the about screen
function About(){
	webix.alert({
    title:"About",
    ok:"Back",
    type:"alert-warning",
    text:"Semiha Konuralp </br> Ebru Yaren Çatak </br> Ece Aydın </br> Arda Özkardeşler </br> Mehmetcan Avdan",
  callback:function(){}
});
	
	
	}
webix.protoUI({
	name:"editactivelist"
}, webix.ActiveContent, webix.EditAbility, webix.ui.list);

//PouchDB setup

var myPouch = new PouchDB('xch');
//Use your own database - this is a test database


//Proxy for PouchDB
webix.proxy.proxyPouchDB = {
    $proxy:true,

    load:function(view, callback){
        //Build JSON Array from database
		myPouch.allDocs({
		  include_docs: true
		}).then(function (result) {
		  // handle result
			console.log(result);
			var todo_data = [];
			result.rows.forEach(function(element, index, array){
				todo_data.push(element.doc);
			});
			view.parse(todo_data, 'json');
		}).catch(function (err) {
			//something really bad happened 
		  console.log(err);
		});
    },
    save:function(view, update, dp, callback){

        //your saving pattern
        if(update.operation == "update"){
			//already having an _id
			myPouch.put(update.data).then(function (response) {
			  // handle response
				var item = view.getItem(update.data["id"]);
				item._rev = response.rev;
				view.updateItem(update.data["id"],item);
				view.refresh();	
				webix.dp(view).reset();
			}).catch(function (err) {
			  console.log(err);
			});
		}

		if(update.operation == "insert"){
			myPouch.post(update.data).then(function (response) {
			  // handle response
				var item = view.getItem(update.data["id"]);
				item._id = response.id;
				item._rev = response.rev;
				view.updateItem(update.data["id"],item);
				view.refresh();
				webix.dp(view).reset();
			}).catch(function (err) {
			  console.log(err);
			});
		}
	}
};

//Main toolbar
var toolbar = {
	view:"toolbar",
	cols:[
		
		{view:"button", id:"syncDB", type:"icon", icon:"refresh", click: syncDB},
		{}, 
		{view:"button", id:"About", type:"icon", icon:"info-circle", click: About}
	]
};

//Main task view
//A list with custom item display
var list = {
	view:"editactivelist", 
	id:"list", 
	borderless:true, 
	autoheight:true,
	drag:"order",
	editable:true, 
	editor:"text",	
	activeContent:{
        wipButton:{
            id:"wipButtonId",
            view:"button",
			type:"icon",
			icon:"check-circle",
			width:32
        },		
        doneButton:{
            id:"doneButtonId",
            view:"button",
			type:"icon",
			icon:"circle-o",
            width:32
        }
	},
	template: function (obj, common) {
		var active = (obj.done == -1);
		if (active)
			return "<div style='float:left;'>" + common.wipButton(obj, common) + "</div><div style='float:left;'>" + obj.value + "</div>";
		else 
			return "<div style='float:left;'>" + common.doneButton(obj, common) + "</div><div style='float:left;'>" + obj.value + "</div>";	
	},	
	on:{
		//disallow edit for finished tasks
		onBeforeEditStart:function(id){
			if (this.getItem(id).done == 1)
				return false;
		},
		//delete empty task
		onAfterEditStop:function(state, editor){
			if (state.value == "")
				this.remove(editor.id);
		},
		//save data after reordering
		onAfterDropOrder:function(id){
			webix.dp(this).save(id);
		}
		
	},

	url: "proxyPouchDB->xch",
	save:"proxyPouchDB->xch"
};

app = {};
//Main layout of the application
app.ui = {
	id: "mainLayout",
	rows: [
		toolbar,
		list	
	]
};
