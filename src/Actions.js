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