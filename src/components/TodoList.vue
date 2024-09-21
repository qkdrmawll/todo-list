<template>
    <div>
        <transition-group name="list" tag="ul">
            <li v-for="(item, index) in propsdata" v-bind:key="item.item" class="shadow">
                <span><i class="fa-solid fa-check checkBtn" v-bind:class="{checkBtnCompleted:item.textCompleted}" v-on:click="toggleComplete(item, index)"></i></span>
                <span v-bind:class="{textCompleted:item.completed}">{{ item.item }}</span>
                <span class="removeBtn" v-on:click="removeTodo(item, index)">
                    <i class="fa-regular fa-trash-can"></i>
                </span>
            </li>
        </transition-group>

    </div>
</template>
<script>
export default {
    props: ['propsdata'],
    methods: {
        removeTodo(item, index) {
            this.$emit('removeItem',item,index);
        },
        toggleComplete(item,index) {
            this.$emit('toggleItem',item,index);
        }
    }
}
</script>
<style>
ul {
    list-style-type: none;
    padding-left: 0px;
    margin-top: 0px;
    text-align: left;
}
li {
    display: flex;
    min-height: 50px;
    height: 50px;
    line-height: 50px;
    margin: 0.5rem 0;
    padding: 0 0.9rem;
    background: white;
    border-radius: 5px;
}
.removeBtn {
    margin-left: auto;
    color: red;
}
.checkBtn {
    line-height: 45px;
    color: green;
    margin-right: 5px ;
}
.checkBtnCompleted {
    color: #b3adad;
}
.textCompleted {
    text-decoration: line-through;
    color: #b3adad;
}

/* 리스트 아이템 트랜지션 효과 */
.list-enter-active, .list-leave-active {
    transition: all 0.5s;
}
.list-enter-from, .list-leave-to {
    opacity: 0;
    transform: translateY(30px);
}
</style>