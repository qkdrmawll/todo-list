<template>
    <TodoHeader></TodoHeader>
    <TodoInput v-on:addTodoItem="addOneItem"></TodoInput>
    <TodoList v-bind:propsdata="todoItems" v-on:removeItem="removeOneItem" v-on:toggleItem="toggleOneItem"></TodoList>
    <TodoFooter v-on:clearAll="clearAllItems"></TodoFooter>
  </template>
  
  <script>
  import TodoHeader from '@/components/TodoHeader.vue';
  import TodoInput from '@/components/TodoInput.vue';
  import TodoList from '@/components/TodoList.vue';
  import TodoFooter from '@/components/TodoFooter.vue';
  export default {
    components: {
      TodoHeader,
      TodoInput,
      TodoList,
      TodoFooter,
    },
    data() {
      return {
        todoItems: []
      }
    },
    methods: {
      addOneItem(todoItem) {
        console.log(todoItem);
        var obj = { completed: false, item: todoItem }
        localStorage.setItem(todoItem, JSON.stringify(obj));
        this.todoItems.push(obj);
      },
      removeOneItem(item, index) {
        localStorage.removeItem(item.item);
        this.todoItems.splice(index, 1);
      },
      toggleOneItem(item, index) {
        this.todoItems[index].completed = !this.todoItems[index].completed;
        localStorage.removeItem(item.item);
        localStorage.setItem(item.item, JSON.stringify(item));
      },
      clearAllItems() {
        localStorage.clear();
        this.todoItems = [];
      }
    },
    created() {
      if (localStorage.length > 0) {
        for (var i = 0; i < localStorage.length; i++) {
          this.todoItems.push(JSON.parse(localStorage.getItem(localStorage.key(i))));
        }
      }
    },
  }
  </script>
  
  <style>
  body {
    text-align: center;
    background-color: blanchedalmond;
  }
  
  input {
    border-style: groove;
    width: 200px;
  }
  
  button {
    border-style: groove;
  }
  
  .shadow {
    box-shadow: 5px 10px 10px rgba(0, 0, 0, 0.03);
  }
  </style>
  