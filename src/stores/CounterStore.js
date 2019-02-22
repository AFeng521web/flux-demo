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