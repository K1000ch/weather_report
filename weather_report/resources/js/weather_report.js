$(function(){
//各種変数を定義
    
    //現在時刻を取得
    var now = moment();
    
    //表示する都市IDを指定
    //city_name、city_name_jp、city_idそれぞれを適切に定義することで、表示したい都市の増減に対応できる
    var wr_city_list = {
        tokyo : {
            city_name : "tokyo",
            city_name_jp : "東京",
            city_id : 1850147,
        },
        kanagawa : {
            city_name : "kanagawa",
            city_name_jp : "神奈川",
            city_id : 1860293,   
        },/*
        ebetsu : {
            city_name : "ebetsu",
            city_name_jp : "江別",
            city_id : 2130404,   
        },
        canberra : {
            city_name : "canberra",
            city_name_jp : "キャンベラ",
            city_id : 2172517,   
        }*/
    }
    
    //天気リスト
    //OpenWeatherのAPIが送ってくる天気の正確なリストが不明なので、とりあえず代表的な五種類のみ指定。
    var weather_list = {
        "Clear" : {
            eng : "Clear",
            jp : "晴れ",
            icon_name : "clear.png",
            class_name : "clear"
        },
        "Clouds" : {
            eng : "Clouds",
            jp : "曇り",
            icon_name : "clouds.png",
            class_name : "clouds"
        },
        "Rain" : {
            eng : "Rain",
            jp : "雨",
            icon_name : "rain.png",
            class_name : "rain"
        },
        "Snow" : {
            eng : "Snow",
            jp : "雪",
            icon_name : "snow.png",
            class_name : "snow"
        },
        "Mist" : {
            eng : "Mist",
            jp : "霧",
            icon_name : "mist.png",
            class_name : "mist"
        },
        "Unknown" : {
            eng : "Unknown",
            jp : "不明",
            icon_name : "unknown.png",
            class_name : "unknown"
        },
        "Error" : {
            eng : "Error",
            jp : "エラー",
            icon_name : "error.png",
            class_name : "error"
        },
        "undefind" : {
            icon_name : "error.png",
            class_name : "error"
        }
    }
    
    //open weather mapへアクセスするためのパラメータを定義
    const owm_api_key = "36d056686c3ee6e779b41d3b9eba317d";
    const owm_url = "http://api.openweathermap.org/data/2.5/forecast?id=";
    

//以下で各種関数を定義
    //swiperでスライドショーを動かすための関数
    function move_swiper(){
        var mySwiper = new Swiper('#weather_report_1347 .swiper-container', {
            autoplay: {
                delay: 2000,
                stopOnLastSlide: false,
                disableOnInteraction: false,
                reverseDirection: false
            },
            speed : 2000,
            loop : true,
            width : 320,
            height : 50,
            noSwiping : true,
            spaceBetween : 2
        });
    }
    
    //APIにアクセスし気象情報を表示するための関数
    function get_weather_report(owm_city_id,owm_time){
        owm_time.format("YYYY-MM-DD HH:mm:ss");

        //open weather mapへアクセスするためのパラメータを指定
        var request = owm_url + owm_city_id +"&APPID=" + owm_api_key;


        //以下、OpenWeatherMapのAPIにアクセスするための処理
        $.ajax({
            type : "GET",
            url : request,
            dataType : "json",
            async: false
        })
        .done((response) => {
            //気象情報の配列から時刻のみを取り出す
            var weather_per_time = response["list"].map(function(val){
                return val["dt_txt"];
            });

            //以下、現在時刻と気象情報の時刻を比較することにより、表示すべき予報を特定するための処理。OpenWeatherMapの予報は3時間ごとなので、予報時刻から±1.5時間以内を基準に表示する予報を決める。

            //表示すべき気象情報のキーを格納するための変数を初期化
            var weather_key = "";
            
            
            $.each(weather_per_time , function(key , val){    
                var date_time = moment(val);
                var before = date_time.clone().subtract({hours: 1.5}).format("YYYY-MM-DD HH:mm:ss");
                var after = date_time.clone().add({hours: 1.5}).format("YYYY-MM-DD HH:mm:ss");
                
                if(now.isBetween(
                        before,
                        after,
                        "second"
                    ))
                {
                    weather_key = key;
                }
            });
            
            //天気名(Rainなど)を変数に格納
            var weather_report = response["list"][weather_key]["weather"][0]["main"];
            
            //なんらかの原因で適切な天気予報が帰ってこなかった場合falseを返すために処理を分岐
            if(weather_key == ""){
                 back = false;
            }else{
                 back = weather_report;
            }
        })
        .fail((response) => {
             //APIアクセスが失敗したらfalseを返す
             back = false;
        });
        return back;
    }
    
    //DOMを生成するための関数
    function generate_dom(city_name , weather_text , class_name , icon_name){

        var test = "<div class='swiper-slide " + class_name + "'><img class='weather_icon' src='./resources/icons/" + icon_name + "' alt=''><div class='weather_text'>" + city_name + "の天気は<span>" + weather_text + "</span></div></div>";
        
        $("#weather_report_1347 .swiper-wrapper").append(test);
        /*
        生成するDOMの構造は以下のとおり
            <div class="swiper-slide">
                <img class="weather_icon" src="./resources/icons/clear.png" alt="">
                <div class="weather_text">                   　
                    の天気は
                    <span></span>
                </div>
            </div>
        */
    }
    

    //配列wr_city_listを元にAPIへアクセスし、DOMを生成
    $.each(wr_city_list , function(key , val){
        var city_id = val["city_id"];
        var city_name = val["city_name"];
        var city_name_jp = val["city_name_jp"];
        var weather = get_weather_report(city_id,now);
        
        //エラーや不具体対応のために処理を分岐
        if(weather != false){
            if(weather_list[weather] == null){
                //変数weather_listに存在しない天気が送られてきた場合
                generate_dom(
                    val["city_name_jp"],
                    weather_list["Unknown"]["jp"],
                    weather_list["Unknown"]["class_name"],
                    weather_list["Unknown"]["icon_name"]
                );
            }else{
                //正常に処理がなされた場合
                generate_dom(
                    val["city_name_jp"],
                    weather_list[weather]["jp"],
                    weather_list[weather]["class_name"],
                    weather_list[weather]["icon_name"]
                );
            }
        }else{
            //APIから気象情報が帰ってこなかった場合
            generate_dom(
                val["city_name_jp"],
                weather_list["Unknown"]["jp"],
                weather_list["Unknown"]["class_name"],
                weather_list["Unknown"]["icon_name"]
            );
        }
    });
    
    //スライドを動かす
    move_swiper();
});
