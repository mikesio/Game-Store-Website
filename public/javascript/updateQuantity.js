var add = function(valueToAdd,id){
    var currentQantity = parseInt(document.getElementById('quantity_'+id).value);
    //alert("adding: " + valueToAdd + " currentQantity: "+currentQantity);
    currentQantity += valueToAdd;
    //alert( "new currentQantity: "+currentQantity);
    if(currentQantity<1)
      currentQantity = 1
    document.getElementById('quantity_'+id).value = currentQantity;
    //document.getElementById('quantity_'+id).textContent = currentQantity;
};
