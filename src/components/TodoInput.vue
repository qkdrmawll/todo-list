<template>
    <div class="inputBox shadow">
        <input type="text" v-model="newTodoItem" v-on:keyup.enter="addTodo">
        <span class="addContainer" v-on:click="addTodo">
            <i class="fa-regular fa-plus addButton"></i>
        </span>
        <ModalComponent v-if="showModal" @close="showModal = false">
            <template #header>
                <h3>경고</h3>
            </template>
            <template #body>
                아무것도 입력하지 않았습니다
            </template>
            <template #footer>
                <span @click="showModal=false">
                    <i class="fa-regular fa-x"></i>
                </span>
            </template>
        </ModalComponent>
    </div>
</template>
<script>
import ModalComponent from './common/ModalComponent.vue'
export default {
    components: {
        ModalComponent
    },
    data: function () {
        return {
            newTodoItem: "",
            showModal: false,
        }
    },
    methods: {
        addTodo() {
            if (this.newTodoItem !== '') {
                console.log(this.newTodoItem);
                this.$emit('addTodoItem', this.newTodoItem);
                this.clearInput();
            } else {
                this.showModal = !this.showModal;
            }
        },
        clearInput() {
            this.newTodoItem = '';
        }
    }
}
</script>
<style scoped>
input:focus {
    outline: none;
}

.inputBox {
    background-color: white;
    height: 50px;
    line-height: 50px;
    border-radius: 5px;
}

.inputBox input {
    border-style: none;
    font-size: 0.9rem;
}

.addContainer {
    float: right;
    background: linear-gradient(to right, #b0cf86, #9cbce3);
    display: block;
    width: 3rem;
    border-radius: 0 5px 5px 0;
}

.addButton {
    color: white;
    vertical-align: middle;
}
</style>