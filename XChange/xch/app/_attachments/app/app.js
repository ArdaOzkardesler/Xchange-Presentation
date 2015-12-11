//TODO - function that gets the currency from internet

function syncDB(){
	//http://api.fixer.io/latest?base=RON
	
	webix.ajax().get("http://api.fixer.io/latest", { base : "RON" }, function(text, xml, xhr){
    //response
    console.log(text);
});

var promise = webix.ajax().get("http://api.fixer.io/latest", { base : "RON" });

promise.then(function(realdata){
    //success
    console.log(realdata);
    //$$("acc").index($$("info")).body="Today"+(new Date().toISOString())+"</br> Last Update" + (realdata.json()).date;
    
    //TODO - find another control
    
    
    myPouch.get('_local/LASTUPDATE').then(function (doc) {
	  // handle doc update
	  var mydoc = realdata.json();
	  mydoc._id = "_local/LASTUPDATE";
	  mydoc._rev = doc._rev;
	  myPouch.put(mydoc).then(function (response) {
		  // handle response
		  console.log(response);
		}).catch(function (err) {
		  console.log(err);
		});
	  
	}).catch(function (err) {
	  console.log(err);
	  //create
	  var mydoc = realdata.json();
	  mydoc._id = "_local/LASTUPDATE";
	  myPouch.put(mydoc).then(function (response) {
		  // handle response
		  console.log(response);
		}).catch(function (err) {
		  console.log(err);
		});
	});
}).fail(function(err){
    //error
    webix.message({type:"error",text:err});
});

	/*
	 * 
	 * {
	 * 	"base":"RON",
	 *  "date":"2015-11-20",
	 *  "rates":{
	 *		"AUD":0.33361,
	 * 		"BGN":0.44012,"BRL":0.89248,"CAD":0.3202,"CHF":0.24403,
	 * 		"CNY":1.5356,"CZK":6.0829,"DKK":1.6788,"GBP":0.15775,"HKD":1.864,
	 * 		"HRK":1.7165,"HUF":69.751,"IDR":3269.6,"ILS":0.93328,"INR":15.921,
	 * 		"JPY":29.542,"KRW":277.79,"MXN":3.9894,"MYR":1.0307,"NOK":2.0711,
	 * 		"NZD":0.36671,"PHP":11.304,"PLN":0.95439,"RUB":15.602,"SEK":2.0882,
	 * 		"SGD":0.33964,"THB":8.596,"TRY":0.67881,"USD":0.24051,"ZAR":3.3499,"EUR":0.22503
	 * 		}
	 * }
	 * */	
	}


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
		{
    view:"accordion",
    id: "acc",
    multi:true,
    rows:[ //or rows 
        { header:"Info", id:"info", body:"Today"+(new Date().toISOString())+"</br> Last Update" }, 
        { header:"Exchange Rates", body:"USD</br>EUR</br>TRY</br>GBP" }
    ]
}
			
	]
};
