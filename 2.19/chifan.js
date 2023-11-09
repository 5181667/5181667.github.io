
    var foods = ['拉麵','義大利麵','炒飯','滷肉飯','鍋貼','甜不辣','牛肉麵','漢堡'];

    function pickFood(){
    var foodIndex = Math.floor(Math.random()*foods.length);
    $("#result").html(foods[foodIndex]);
}

    $("#pick-btn").click(pickFood);
