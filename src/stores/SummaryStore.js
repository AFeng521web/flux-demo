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