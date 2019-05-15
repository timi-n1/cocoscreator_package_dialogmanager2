/**
 * 程序自动生成，切勿手动修改
 */

(function () {

var Data = '##DialogDataHoldPlace##';

var Map = {};
for (var i = 0; i < Data.length; i++) {
    Map[Data[i].name] = Data[i];
}

window['cs'] = window['cs'] || {};
window['cs']['Dialog'] = Map;
if (typeof module == 'object' && typeof module.exports == 'object') {
    module.exports = Data;
}

})();