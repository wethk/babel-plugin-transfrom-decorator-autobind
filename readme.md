## babel-plugin-transfrom-decorator-autobind
为解决RN中使用decorator autobind偶发性this指针丢失问题，部分人选用箭头函数替换方案，但也会偶发的遇到箭头函数this指向错误的问题。为了让业务线无痛使用@autobind，决定使用babel的解决方案，babel时，自动识别出使用了autobind的func，并自动添加到constructor（若无constructor会自动创建）

npm包名：babel-plugin-transfrom-decorator-autobind

```js

const babel = require('babel-core');

const code = `
class A{

    @autobind
    change(){
        var a = 1
    }

    @autobind
    onPress(){
        var w= 2
    }
}`


const result = babel.transform(code,{
    plugins:['syntax-decorators','./babel-plugin-transfrom-decorator-autobind.js']
})

//转换后
class A{

    constructor(){
        this.change = this.change.bind(this);
        this.onPress = this.onPress.bind(this);
    }

    change(){
        var a = 1
    }

    onPress(){
        var w= 2
    }
}


```

