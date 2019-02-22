# flux学习笔记

# 一.Flux是什么
简单来说，flux就是一个数据管理框架，2013年，Facebook推出React框架的同时，也发布了flux。
****
# 二.基本概念
![flux工作流程](https://img-blog.csdnimg.cn/20190222162951483.png)
View: 视图部分，负责显示用户界面。
Action: 视图层发出的消息（用户操作导致，比如鼠标点击页面）
Dispatcher: 处理动作分发，维持Store之间的依赖关系。
Store: 负责存储数据和处理数据相关逻辑。并且数据一旦发生变动，就要提醒View更新页面。

**flux的最大特点：单向数据流。**
* 1.用户访问 View
* 2.View 发出用户的 Action
* 3.Dispatcher 收到 Action，要求 Store 进行相应的更新
* 4.Store 更新后，发出一个"change"事件
* 5.View 收到"change"事件后，更新页面
****

# 三.一个demo说明flux工作过程。
### Dispatcher(一个应用只需要一个全局的Dispatcher)

```
import { Dispatcher } from 'redux';

//导出一个全局的dispatcher
export default new Dispatcher();
```
### action(派发action)
```
import * as ActionTypes from './ActionTypes.js';
import AppDispatcher from './AppDispatcher.js';

export const increment = (counterCaption) => {
  // 直接在这里派发action，而不是返回一个action对象。
  AppDispatcher.dispatch({
    type: ActionTypes.INCREMENT,
    counterCaption: counterCaption
  });
};

export const decrement = (counterCaption) => {
  AppDispatcher.dispatch({
    type: ActionTypes.DECREMENT,
    countetCaption: counterCaption
  });
};
```
虽然这个文件被命名为Actions.js，但是要注意这个文件并不返回action对象，**而是返回能够产生并派发action对象的函数。**
****

### Store(存储应用状态，同时还要接受Dispatcher派发的action，根据action来决定是否要更新应用状态)
```
import AppDispatcher from '../AppDispatcher.js';
import * as ActionTypes from '../ActionTypes.js';
import { EventEmitter } from 'events';

const CHANGE_EVENT = 'changed';

// 定义一个模块级变量，用来存储store.
const counterValues = {
  'First': 10,
  'Second': 20,
  'Third': 30
};

const CounterStore = Object.assign({}, EventEmitter.prototype, {
  // 严格来说，getCounterValues这样的getter函数，应该返回一个不可变对象（Immutable）数据
  getCounterValues: function() {
    return counterValues;
  },

  // 广播store发生变化
  emitChange: function() {
    this.emit(CHANGE_EVENT);
  },

  // 添加事件监听函数，当监听的事件发生时，执行回调函数
  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  // 取消事件监听函数
  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }
});


// 注册action回调函数，每派发一个action，这个回调函数就会被执行(register上注册的所有回调函数都会被执行)。
// 当通过register函数把一个回调函数注册到Dispatcher之后，
// 所有派发给Dispatcher的action对象，都会传递到这个回调函数中来。
CounterStore.dispatchToken = AppDispatcher.register((action) => {
  //处理action
  if(action.type === ActionTypes.INCREMENT) {
    counterValues[action.counterCaption]++;
    CounterStore.emitChange();
  } else if(action.type === ActionTypes.DECREMENT) {
    counterValues[action.counterCaption]--;
  }
});

export default CounterStore;
```
```
import AppDispatcher from '../AppDispatcher.js';
import * as ActionTypes from '../ActionTypes.js';
import CounterStore from './CounterStore.js';
import { EventEmitter } from 'events';

const CHANGE_EVENT = 'changed';

// 计算总数
function computeSummary(counterValues) {
  let summary = 0;
  for(const key in counterValues) {
    if(counterValues.hasOwnProperty(key)) {
      summary += counterValues[key];
    }
  }
  return summary;
}

const SummaryStore = Object.assign({}, EventEmitter.prototype, {
  getSummary: function() {
    // 这个store没有自己的数据，数据来源于CounterStore
    // 事实上，可以看到SummaryStote并不像CounterStore一样用一个变量counterValues存储数据，
    // SummaryStote不存储数据，而是每次对getSummary的调用，都实时读取CounterStore.getCounterValues，
    // 然后实时计算出总和返回给调用者。
    return computeSummary(CounterStore.getCounterValues());
  },

  emitChange: function() {
    this.emit(CHANGE_EVENT);
  },

  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }
})

SummaryStore.dispatchToken = AppDispatcher.register((action) => {
  if((action.type === ActionTypes.INCREMENT) || (action.type === ActionTypes.DECREMENT)) {
    // 当CounterStore对action处理之后，SummaryStore才再处理。
    // 这个waitFor函数告诉Dispatcher,当前的处理必须要暂停，
    // 直到dispatchToken代表的那些已注册回调函数执行结束才能继续
    AppDispatcher.waitFor([CounterStore.dispatchToken]);

    // 通知变化
    SummaryStore.emitChange();
  } 
});

export default SummaryStore;
```
****
### View
view要实现以下几个功能

 - 创建时要读取Store上的状态来初始化组件内部状态。一般在组件的constructor中做这个操作。
 - 当Store上的状态发生变化时，组件要立刻同步更新内部状态保持一致。一般通过订阅事件的方式，执行给定的回调函数。
 - View如果要改变Store状态，必须而且只能派发action。这个是执行Actions中的函数，在这个函数调用时，生成action，并且直接dispatch出去。

****
# 四.总结
### flux解决了react组件之间如何同步状态的问题。

在flux的架构下，应用的状态被放在Store中，react组件只是扮演view的作用，被动根据Store的状态来渲染，react组件依然也有自己的状态，但是已经完全沦为Store的一个映射，而不是主动变化的数据。

在flux中，用户的操作引发的是一个“动作”的派发，**这个动作会被发送给所有的Store对象（也就是被register注册的所有函数接收）** 引起Store对象的状态改变，而不是直接引发组件的状态改变。因为组件的状态是Store状态的映射，所以改变了Store对象，也就触发了react组件状态的改变，从而引起了界面的重新渲染。

### flux的不足

 - Store之间的依赖关系。
 - 难以进行服务端渲染。
 - Store混杂了逻辑和状态

