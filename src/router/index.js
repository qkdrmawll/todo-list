// 파일 내부에 export default가 있는 경우에는 {}가 필요없고 그렇지 않으면 {}필요
// import하는 요소가 여러개 일때도 {}를 붙인다
import {createRouter, createWebHistory} from 'vue-router';
// @는 src 루트 폴더 경로를 의미
import TodoView from '@/views/TodoView.vue';
import RtcView from '@/views/RtcView.vue';
import ChatRoom from '@/views/ChatRoom.vue';

const routes = [
    {
        path: '/todo',
        name: 'TodoView',
        component: TodoView
    },
    {
        path: '/',
        name: 'RtcView',
        component: RtcView
    },
    {
        path: '/room/:sid/user/:uuid',
        name: 'ChatRoom',
        component: ChatRoom,
        props: true  // 이 설정을 통해 경로 매개변수를 컴포넌트에 전달
    },
]
const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router;