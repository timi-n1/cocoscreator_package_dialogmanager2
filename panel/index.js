Editor.Panel.extend({
    style: `
        :host {
            padding: 4px;
            display: flex;
            flex-direction: column;
        }
        .box{
            display: flex;
            height: 33px;
        }
        .box span{
            width: 100px;
            height: 33px;
        }
        .box ui-asset{
            flex: 2;
        }
        .box ui-input{
            flex: 3;
        }
    `,
    template: `
        <ui-box-container>
            <ui-section v-for="(index,item) in dialogList" v-bind:folded="folded">
                <div class="header">{{item.name}}</div>
                <div class="box">
                    <span>Name</span>
                    <ui-input v-bind:value="item.name" v-on:change="onNameChange(index, $event)"></ui-input>
                </div>
                <div class="box">
                    <span>Prefab</span>
                    <ui-asset class="prefab" :value="item.uuid" type="cc.Prefab" ddrapable="cc.Prefab" v-on:change="onPrefabChange(index, $event)"></ui-asset>
                    <ui-input v-bind:value="item.url" readonly></ui-input>
                </div>
                <div class="box" v-for="(index2, dep) in item.depends">
                    <span>依赖资源{{index2+1}}</span>
                    <ui-asset class="prefab" :value="dep.uuid" type="cc.Prefab" ddrapable="cc.Prefab" v-on:change="onDepandPrefabChange(index, index2, $event)"></ui-asset>
                    <ui-input v-bind:value="dep.url" readonly></ui-input>
                    <ui-button class="cbtn red tiny" @click="delDepend(index, index2)">删除</ui-button>
                </div>
                <div class="box">
                    <span>&nbsp;</span>
                    <ui-button class="cbtn" @click="addDepends(index)">增加依赖项</ui-button>
                    <ui-button class="cbtn red" @click="del(index)">删除此Dialog</ui-button>
                </div>
            </ui-section>
        </ui-box-container>
        <div style="margin-top: 4px;">
            <ui-button class="cbtn green" @click="save">保存</ui-button>
            <ui-button class="cbtn" @click="add">添加</ui-button>
            <ui-button class="cbtn" @click="refresh">同步</ui-button>
            <ui-button class="cbtn" @click="folded=!folded">折叠切换</ui-button>
        </div>
    `,

    ready() {

        const fs = require('fs-extra');
        const path = require('path');
        const resFile = path.resolve(Editor.projectInfo.path, './assets/lib/dialog-data.js');
        const dtsFile = path.resolve(Editor.projectInfo.path, './typings/dialog-data.d.ts');
        const templateFile = path.resolve(Editor.projectInfo.path, './packages/dialog-manager-2/template.js');
        const templateTxt = fs.readFileSync(templateFile, 'utf-8').toString();

        new window.Vue({
            el: this.shadowRoot,
            data: {
                dialogList: [],
                folded: false,
            },
            created() {
                this.init();
            },
            methods: {
                init() {
                    if (fs.existsSync(resFile)) {
                        this.dialogList = require(resFile);
                        this.refresh();
                    }
                },
                onNameChange(index, evt){
                    this.dialogList[index].name = evt.detail.value;
                },
                onPrefabChange(index, evt){
                    console.warn(index, evt.detail.value);
                    Editor.assetdb.queryInfoByUuid(evt.detail.value, (err, data)=>{
                        if( err ){
                            alert(err);
                            return;
                        }
                        if( !data ){
                            data = {uuid:'',url:''};
                        }
                        this.dialogList[index].uuid = data.uuid;
                        this.dialogList[index].url = data.url.replace('db://assets/resources/', '').replace('.prefab','');
                        console.warn(err, data);
                    });
                },
                onDepandPrefabChange(index, index2, evt){
                    console.warn(index, evt.detail.value);
                    Editor.assetdb.queryInfoByUuid(evt.detail.value, (err, data)=>{
                        if( err ){
                            alert(err);
                            return;
                        }
                        if( !data ){
                            data = {uuid:'',url:''};
                        }
                        this.dialogList[index].depends[index2].uuid = data.uuid;
                        this.dialogList[index].depends[index2].url = data.url.replace('db://assets/resources/', '').replace('.prefab','');
                        console.warn(err, data);
                    });
                },
                refresh(){
                    for(let item of this.dialogList){
                        Editor.assetdb.queryInfoByUuid(item.uuid, (err, data)=>{
                            item.url = data.url.replace('db://assets/resources/', '').replace('.prefab','');
                            for(let dep of item.depends){
                                Editor.assetdb.queryInfoByUuid(dep.uuid, (err, data2)=>{
                                    dep.url = data2.url.replace('db://assets/resources/', '').replace('.prefab','');
                                    
                                });
                            }
                        });
                    }
                },
                add(index) {
                    this.dialogList.push({
                        name: '测试Dialog',
                        uuid: '',
                        url: ''
                    });
                },
                addDepends(index){
                    if( !this.dialogList[index].depends ){
                        Vue.set(this.dialogList[index], 'depends', [])
                    }
                    this.dialogList[index].depends.push({
                        uuid: '',
                        url: ''
                    });
                },
                del(index){
                    this.dialogList.splice(index, 1);
                },
                delDepend(index, index2){
                    this.dialogList[index].depends.splice(index2, 1);
                },
                save() {
                    //js文件
                    const txt = templateTxt.replace(`'##DialogDataHoldPlace##'`, JSON.stringify(this.dialogList, true, 4));
                    fs.ensureFileSync(resFile);
                    fs.writeFileSync(resFile, txt);
                    //d.ts文件
                    let dts = 'declare module cs.Dialog {\n';
                    for(let item of this.dialogList){
                        dts += `\texport var ${item.name}: DialogData\n`;
                    }
                    dts += '}\n';
                    fs.ensureFileSync(dtsFile);
                    fs.writeFileSync(dtsFile, dts);
                    alert('成功');
                }
            }
        });
    },
});