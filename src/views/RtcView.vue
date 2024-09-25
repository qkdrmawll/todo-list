<template>
    <div class="text-center">
        <h1>Simple WebRTC Signaling Server</h1>
        <div id="container">
            <p>
                This part receives a room number (or generates a new one), and redirects current user there.
            </p>
            <form @submit.prevent="createRoom">
                <input type="hidden" id="uuid" v-model="uuid" />
                <div class="row justify-content-md-center">
                    <div class="input-group col-md-6 mb-3 justify-content-md-center">
                        <div v-if="rooms.length" :data-uid="uuid">
                            <label for="rooms-list">Select one of the rooms created:</label><br />
                            <h4>
                                <span v-for="r in rooms" :key="r.id">
                                    <a :href="`/room/${r.id}`" :id="`button-link-${r.id}`">
                                        <button type="button" @click="addUuidToButtonLink(r.id)"
                                            class="btn badge badge-primary">
                                            {{ r.id }}
                                        </button>
                                    </a>
                                </span>
                            </h4>
                        </div>
                        <div class="mb-3">
                            <label for="id">To create a new room enter your room number, or press 'Random #' button to
                                get a random one</label>
                            <input class="form-control" name="id" v-model="roomId" type="number"
                                placeholder="Min: 0, max: 99" min="0" max="99" required />
                        </div>
                        <div>
                            <button @click="getRandomRoom" class="btn btn-outline-success" type="button">Random
                                #</button>
                            <button class="btn btn-outline-primary" type="submit">Create Selected Room</button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </div>
</template>

<script>
import axios from "axios";

export default {
    data() {
        return {
            uuid: "",
            roomId: "",
            rooms: [],
        };
    },
    mounted() {
        this.generateUuid();
        this.loadRooms();
    },
    methods: {
        generateUuid() {
            if (!localStorage.getItem("uuid")) {
                localStorage.setItem("uuid", this.guid());
            }
            this.uuid = localStorage.getItem("uuid");
        },
        guid() {
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
                let r = (Math.random() * 16) | 0,
                    v = c == "x" ? r : (r & 0x3) | 0x8;
                return v.toString(16);
            });
        },
        async loadRooms() {
            try {
                const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/reservation-service/api/rooms`);
                this.rooms = response.data;
            } catch (error) {
                console.error("API 요청 중 에러 발생:", error);  // 콘솔에 에러 출력
                alert("방 정보를 불러오는 중에 오류가 발생했습니다. 다시 시도해 주세요.");  // 한글로 사용자에게 알림
            }
        },
        addUuidToButtonLink(roomId) {
            let link = document.getElementById(`button-link-${roomId}`).href;
            document.getElementById(`button-link-${roomId}`).href = link + "/user/" + localStorage.getItem("uuid");
        },
        async createRoom() {
            await axios.post(`${process.env.VUE_APP_API_BASE_URL}/reservation-service/api/room/`, { id: this.roomId, uuid: this.uuid }).then(() => {
                this.loadRooms();
            });
        },
        getRandomRoom() {
            axios.get("/api/room/random").then((response) => {
                this.roomId = response.data;
            });
        },
    },
};
</script>

<style>
/* Custom styles */
</style>