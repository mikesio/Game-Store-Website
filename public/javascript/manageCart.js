getTotal();

//add event listener to each removeItemBtn button
var removeButtons = document.getElementsByClassName("removeItemBtn");
for(var i = 0; i<removeButtons.length;i++){
	removeButtons[i].addEventListener("click", requestMysqlDelete);
}

//add event listener to each add and subtract button
var addButtons = document.getElementsByClassName("addBtn");
var subButtons = document.getElementsByClassName("subBtn");
for(var i = 0; i<addButtons.length;i++){
	addButtons[i].addEventListener("click", requestMysqlUpdate);
	subButtons[i].addEventListener("click", requestMysqlUpdate);
}


//add event listener to checkout button
document.getElementById("checkout").addEventListener("click",requestMysqlcheckout);


//use ajax to inform server side to delete a row in table `Cart` of DB
function requestMysqlDelete(e){
	//test log
	console.log(e.target.parentElement.parentElement);
  var req = new XMLHttpRequest();

  //pack up the data that will be sent to the server
  var rowToRemove = e.target.parentElement.parentElement;
  var row = {};
  row.id = rowToRemove.id;	//row.id is equavilent to Cart.id
  row = JSON.stringify(row);

  //get connect with the server
  req.open("POST","/removeCartItem",true);
  req.setRequestHeader("Content-Type", "application/json");

  //callback
  req.addEventListener("load",function(){
    if(req.status >= 200 && req.status < 400){
    	//test log
		var data = JSON.parse(req.responseText);
		console.log(data);
		//remove the row in the table using DOM
		rowToRemove.remove();
		//refresh the subTotal and total 
		getTotal();
    } else {
      console.log("Error in network request: " + req.statusText);
    }});

  //send the data to server
  req.send(row);

  event.preventDefault();
}


var add = function(valueToAdd,id){
    var currentQantity = parseInt(document.getElementById('quantity_'+id).value);
    //alert("adding: " + valueToAdd + " currentQantity: "+currentQantity);
    currentQantity += valueToAdd;
    //alert( "new currentQantity: "+currentQantity);
    if(currentQantity<1)
      currentQantity = 1
    document.getElementById('quantity_'+id).value = currentQantity;
    //document.getElementById('quantity_'+id).textContent = currentQantity;
    getTotal();
};


//use ajax to inform server side to update the quantity in table `Cart` of DB
function requestMysqlUpdate(e){
  var req = new XMLHttpRequest();

  //pack up the data that will be sent to the server
  var cartIdToUpdate = e.target.parentElement.parentElement.id;
  var itemNewQuantity = e.target.parentElement.children[1].value;
  //test log
  //console.log("cartIdToUpdate: "+cartIdToUpdate);
  //console.log(itemNewQuantity);
  var row = {};
  row.id = cartIdToUpdate;	//equavilent to Cart.id
  row.newQuantity = itemNewQuantity
  row = JSON.stringify(row);

  //get connect with the server
  req.open("POST","/updateCartQuantity",true);
  req.setRequestHeader("Content-Type", "application/json");

  //callback
  req.addEventListener("load",function(){
    if(req.status >= 200 && req.status < 400){
    	//test log
		var data = JSON.parse(req.responseText);
		console.log(data);
		//refresh the subTotal and total 
		getTotal();
    } else {
      console.log("Error in network request: " + req.statusText);
    }});

  //send the data to server
  req.send(row);

  event.preventDefault();
}


//use ajax to inform server side to process checkout
function requestMysqlcheckout(e){
  var req = new XMLHttpRequest();

  //get connect with the server
  req.open("POST","/checkout",true);
  req.setRequestHeader("Content-Type", "application/json");

  //callback
  req.addEventListener("load",function(){
    if(req.status >= 200 && req.status < 400){
      //test log
      var data = JSON.parse(req.responseText);
      console.log(data);
      window.location.replace("/myorder");
    } else {
      console.log("Error in network request: " + req.statusText);
    }});

  //send the data to server, which is nothing in this case
  req.send();

  event.preventDefault();
}


function getTotal(){
	var priceCells = document.getElementsByClassName("price");
	var quantityCells = document.getElementsByClassName("quantityDisplay");
	var	subtotalCells = document.getElementsByClassName("subtotal");
	var total = 0

	//console.log(quantityCells[0])

	//calculate the subtotal for each item and then the total
	for(var i = 0;i<quantityCells.length;i++){
		subtotalCells[i].textContent=Number(quantityCells[i].value*priceCells[i].textContent).toFixed(2);
		total += Number(subtotalCells[i].textContent);
	}

	document.getElementById("cartTotal").textContent = "TOTAL $ "+total.toFixed(2);

	//hide the checkout button if total = 0
	if(total===0)
		document.getElementById("checkout").style.visibility = "hidden";


}