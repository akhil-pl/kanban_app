const store = new Vuex.Store({
    state: {
        email: "", // store current user email by created hook
        user: {}, // store current user object (have user details and list of trackers currently active forthem) by created hook
        userlists: [], // Array store details of all list of this user in database by created hook
        usercards: [], //Object stores cards of each logs
        descrip: {} //Object storing lname: description pair
    },
    mutations: {
        setEmail(state, email){
            state.email = String(email)
        },
        setUser(state, user){
            state.user = Object(user)
        },
        setUserLists(state, userlists){
            state.userlists = Object(userlists)
        },
        setUserCards(state, cards){
            const count = state.usercards.push(cards) // cannot find a better way to append
        },
        setDescrip(state, obj){
            state.descrip = {...state.descrip, ...obj}
        }
    },
    getters: {
        getEmail: function(state) {
            return state.email
        },
        getUser: function(state) {
            return state.user
        },
        getUserLists: function(state) {
            return state.userlists
        },
        getUserCards: function(state) {
            return state.usercards
        },
        getDescrip: function(state) {
            return state.descrip
        }
    },
    // actions: {
    //     fetchUser(store){
    //         return fetch("http://localhost:8080/user/"+this.$store.state.email)
    //     }
    // }
});


const About = Vue.component('about', {
    template: `
    <div>
        <h2> <u>This Kanban App is an academic project</u></h2>
        <p> This web app can be used to organize your tasks. An user can have a maximum of five lists (catagorisation of tasks). And 
        as many number of tasks in each list. </br>
        This app is done as a project for MAD II <i>(Modern Application Development II)</i> course, which is part of the online degree 
        programme offered by IITM <i>(Indian Institute of Technology, Madras)</i>. This course comes in the Diploma in programming level of 
        this course.</br>
        The aim of the project is to build a Kanban app, in which user is able to add & track tasks of their choice. The goal is to 
        reduce the load on server by doing rendering of UI & UX on the client frontend. Meanwhile server should be able to do scheduled 
        jobs or other jobs like sending user triggered emails, caching etc.</br>
        <b>Technologies used</b>
        <ul>
            <li><b>Jinja 2 </b>- For html template rendering for sending emails and partially as frontend.</li>
            <li><b>Flask </b>- Flask framework is used for the app creation as it is simple and have most of the essential extensions inbuilt.</li>
            <li><b>Flask-SQLAlchemy </b>- Is used for modelling and querying of database.</li>
            <li><b>Flask-Security</b> - Is used for authentication of user and to provide a basic security of data.</li>
            <li><b>VueJS </b>- Is used as a JavaScript framework for building UI & UX. Inside vue.js used Vuex as the state mansgement library, 
                Vue Router as router for making it a single page application. Also used Chart.js for generating charts.</li>
            <li><b>Redis </b>- A in-memory data structure store used as message broker for managing jobs queue and also for caching.</li>
            <li><b>Celery </b>- An asynchronous job queue for scheduling and executing jobs.</li>
            <li><b>MailHog</b> - A fake SMTP server for email-testing</li>
            <li><b>Weasyprint</b> - For generating pdfs</li>
        </p>
    </div>`
})

const Summary = Vue.component('graph', {
    template: `
    <div>
        <h3> These pie charts shows the current status of each of your lists</h3>
        <p>They are interactive charts, you can select only the options you want</p>
        <div class="row">
            <div v-if="number_of_list > 0" class="col-md-4 border">
                <canvas id="0"></canvas>
            </div>
            <div v-if="number_of_list > 1" class="col-md-4 border">
                <canvas id="1"></canvas>
            </div>
            <div v-if="number_of_list > 2" class="col-md-4 border">
                <canvas id="2"></canvas>
            </div>
            <div v-if="number_of_list > 3" class="col-md-4 border">
                <canvas id="3"></canvas>
            </div>
            <div v-if="number_of_list > 4" class="col-md-4 border">
                <canvas id="4"></canvas>
            </div>
        </div>
    </div>`,

    data: function() {
        return {
            summary: {}
        }
    },

    computed: {
        number_of_list: function() {
            return this.$store.state.userlists.length;
        }
    },

    async beforeMount() { //Mske summary array for chart data
        let current = new Date();
        let now = current.getFullYear() + '-' + (current.getMonth() + 1) + '-' + current.getDate();
        const date1 = new Date(now)
        pending_ok = 0;
        pending_notok = 0;
        done_ok = 0;
        done_notok = 0;
        for (const list of this.$store.state.usercards) {
            for (const card of Object.values(list)[0]) {
                if (card.status == false){
                    const date2 = new Date(card.deadline);
                    const diffTime = date1 - date2;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays > 0){
                        pending_notok++;
                    } else {
                        pending_ok++;
                    }
                } else {
                    const date2 = new Date(card.deadline);
                    const date3 = new Date(card.completion_time);
                    const diffTime = date3 - date2;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays > 0){
                        done_notok++;
                    } else {
                        done_ok++;
                    }
                }
            }
            this.summary[Object.keys(list)[0]] = [done_ok, done_notok, pending_ok, pending_notok];
            pending_ok = 0;
            pending_notok = 0;
            done_ok = 0;
            done_notok = 0;
        }
    },

    async mounted() {  //Cannot find a way to name variable by looping
        const ctx0 = document.getElementById('0');
        const ctx1 = document.getElementById('1');
        const ctx2 = document.getElementById('2');
        const ctx3 = document.getElementById('3');
        const ctx4 = document.getElementById('4');
  
        new Chart(ctx0, {
            type: 'pie',
            data: {
                labels: [
                    'Tasks completed successfully',
                    'Tasks completed after deadline',
                    'Pending tasks with future deadline ',
                    'Pending tasks with expired deadline'
                ],
                datasets: [{
                    label: this.$store.state.userlists[0].lname,
                    data: this.summary[this.$store.state.userlists[0].lname],
                    backgroundColor: [
                        'rgb(0, 255, 0)',
                        'rgb(153, 102, 51)',
                        'rgb(255, 255, 0)',
                        'rgb(255, 0, 0)'
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: this.$store.state.userlists[0].lname
                    }
                }
            }
        });

        new Chart(ctx1, {
            type: 'pie',
            data: {
                labels: [
                    'Tasks completed successfully',
                    'Tasks completed after deadline',
                    'Pending tasks with future deadline ',
                    'Pending tasks with expired deadline'
                ],
                datasets: [{
                    label: this.$store.state.userlists[1].lname,
                    data: this.summary[this.$store.state.userlists[1].lname],
                    backgroundColor: [
                        'rgb(0, 255, 0)',
                        'rgb(153, 102, 51)',
                        'rgb(255, 255, 0)',
                        'rgb(255, 0, 0)'
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: this.$store.state.userlists[1].lname
                    }
                }
            }
        });

        new Chart(ctx2, {
            type: 'pie',
            data: {
                labels: [
                    'Tasks completed successfully',
                    'Tasks completed after deadline',
                    'Pending tasks with future deadline ',
                    'Pending tasks with expired deadline'
                ],
                datasets: [{
                    label: this.$store.state.userlists[2].lname,
                    data: this.summary[this.$store.state.userlists[2].lname],
                    backgroundColor: [
                        'rgb(0, 255, 0)',
                        'rgb(153, 102, 51)',
                        'rgb(255, 255, 0)',
                        'rgb(255, 0, 0)'
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: this.$store.state.userlists[2].lname
                    }
                }
            }
        });

        new Chart(ctx3, {
            type: 'pie',
            data: {
                labels: [
                    'Tasks completed successfully',
                    'Tasks completed after deadline',
                    'Pending tasks with future deadline ',
                    'Pending tasks with expired deadline'
                ],
                datasets: [{
                    label: this.$store.state.userlists[3].lname,
                    data: this.summary[this.$store.state.userlists[3].lname],
                    backgroundColor: [
                        'rgb(0, 255, 0)',
                        'rgb(153, 102, 51)',
                        'rgb(255, 255, 0)',
                        'rgb(255, 0, 0)'
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: this.$store.state.userlists[3].lname
                    }
                }
            }
        });

        new Chart(ctx4, {
            type: 'pie',
            data: {
                labels: [
                    'Tasks completed successfully',
                    'Tasks completed after deadline',
                    'Pending tasks with future deadline ',
                    'Pending tasks with expired deadline'
                ],
                datasets: [{
                    label: this.$store.state.userlists[4].lname,
                    data: this.summary[this.$store.state.userlists[4].lname],
                    backgroundColor: [
                        'rgb(0, 255, 0)',
                        'rgb(153, 102, 51)',
                        'rgb(255, 255, 0)',
                        'rgb(255, 0, 0)'
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: this.$store.state.userlists[4].lname
                    }
                }
            }
        });

        
    }
})

const Dashboard = Vue.component('tracker-type', {
    template: `
    
    
    <div class="row" id="dash_inside_row">
        <div class="col-md-2 border" id="form_column">
            <div class="row">
                <h6 v-if="number_of_list <= 0">
                    There is no list in your board currently.
                    <button class="btn btn-outline-success btn-sm" type="button" v-on:click="Viewaddlistform()">
                    <i class="bi bi-journal-plus">Add list</i></button>
                </h6>
                <h6 v-else-if="number_of_list >= 5">
                    <button class="btn btn-outline-success btn-sm" type="button" v-on:click="NoMoreList()">
                    <i class="bi bi-journal-plus">Add list</i></button>
                </h6>
                <h6 v-else>
                    <button class="btn btn-outline-success btn-sm" type="button" v-on:click="Viewaddlistform()">
                    <i class="bi bi-journal-plus">Add list</i></button>
                </h6>
                <p>
                    <button class="btn btn-outline-success btn-sm" type="button" v-on:click="Export()">
                    <i class="bi bi-send-check">Export</i></button>
                </p>
            </div>
            
            <div class="row" id="border">
                <div v-if="addlist != null">
                    <div class="row">
                        <div class="col-auto">
                            <label for="NewListName" class="col-form-label">List name</label>
                        </div>
                        <div class="col-auto">
                            <input type="text" id="NewListName" class="form-control form-control-sm">
                        </div>
                        <div class="col-auto">
                            <label for="NewListDescription" class="col-form-label">Description</label>
                        </div>
                        <div class="col-auto">
                            <input type="text" id="NewListDescription" class="form-control form-control-sm">
                        </div>
                        <div class="d-grid gap-2">
                            <button class="btn btn-primary btn-sm" type="button" v-on:click="CreateList">Create List</button>
                        </div>
                    </div>
                </div>

                <div v-if="editlist != null">
                    <div class="row">
                        <div class="col-auto">
                            <label for="EditListName" class="col-form-label">List name</label>
                        </div>
                        <div class="col-auto">
                            <input type="text" id="EditListName" :value="this.editlist" class="form-control form-control-sm">
                        </div>
                        <div class="col-auto">
                            <label for="EditListDescription" class="col-form-label">Description</label>
                        </div>
                        <div class="col-auto">
                            <input type="text" id="EditListDescription" class="form-control form-control-sm">
                        </div>
                        <div class="d-grid gap-2">
                            <button class="btn btn-primary btn-sm" type="button" v-on:click="EditList">Edit {{this.editlist}}</button>
                        </div>
                    </div>
                </div>


                <div v-if="addcardtolist != null">
                    <div class="row">
                        <p> Add new task to {{this.addcardtolist}}
                        <div class="col-auto">
                            <label for="NewTaskName" class="col-form-label">Task name</label>
                        </div>
                        <div class="col-auto">
                            <input type="text" id="NewTaskName" class="form-control form-control-sm">
                        </div>
                        <div class="col-auto">
                            <label for="NewTaskDetails" class="col-form-label">Task details</label>
                        </div>
                        <div class="col-auto">
                            <input type="text" id="NewTaskDetails" class="form-control form-control-sm">
                        </div>
                        <div class="col-auto">
                            <label for="NewTaskDeadline" class="col-form-label">Deadline</label>
                        </div>
                        <div class="col-auto">
                            <input type="date" id="NewTaskDeadline" class="form-control form-control-sm">
                        </div>
                        <div class="d-grid gap-2">
                            <button class="btn btn-primary btn-sm" type="button" v-on:click="CreateCard">Create New Task</button>
                        </div>
                    </div>
                </div>

                <div v-if="editcard != null">
                    <div class="row">
                        <p> Edit {{this.editcard}} in {{this.editcardoflist}} <p>
                        <div class="col-auto">
                            <label for="EditTaskName" class="col-form-label">Task name</label>
                        </div>
                        <div class="col-auto">
                            <input type="text" id="EditTaskName" :value="this.editcard" class="form-control form-control-sm">
                        </div>
                        <div class="col-auto">
                            <label for="EditTaskDetails" class="col-form-label">Detils</label>
                        </div>
                        <div class="col-auto">
                            <input type="text" id="EditTaskDetails" class="form-control form-control-sm">
                        </div>
                        <div class="col-auto">
                            <label for="EditTaskDeadline" class="col-form-label">Deadline</label>
                        </div>
                        <div class="col-auto">
                            <input type="date" id="EditTaskDeadline" class="form-control form-control-sm">
                        </div>
                        <div class="d-grid gap-2">
                            <button class="btn btn-primary btn-sm" type="button" v-on:click="EditCard">Edit {{this.editcard}} </button>
                        </div>
                    </div>
                </div>

                <div v-if="movecard != null">
                    <div class="row">
                        <p> Move {{this.movecard}} to <p>
                        <li v-for="list in userlists" :key="list.lid">
                            <button v-on:click="MoveCard(list.lid)" >{{list.lname}}</button>
                        </li>
                    </div>
                </div>
            </div>


        </div>

        
        <div class="col-md-2 border" v-for="list in usercards" :key="Object.keys(list)[0]" id="list_column">
            <div class="row" id="list_details">
                <h4 id="listname"> {{Object.keys(list)[0]}} </h4>
                <small>{{descrip[Object.keys(list)[0]]}}</small>
                <div class="btn-group btn-group-sm" role="group" aria-label="Small button group">
                    <button title="Edit this List" class="btn btn-outline-success btn-sm" v-on:click="ViewEditListForm(Object.keys(list)[0])">
                        <i class="bi bi-pen"></i>
                    </button>
                    <button title="Delete this List" class="btn btn-outline-danger btn-sm" v-on:click="Deletelist(Object.keys(list)[0])">
                        <i class="bi bi-trash3"></i>
                    </button>
                    <button title="Add New Task in this list" class="btn btn-outline-success btn-sm" type="button" v-on:click="Viewaddcardform(Object.keys(list)[0])">
                        <i class="bi bi-folder-plus"></i>
                    </button>
                    <button title="Export Cards in this List" class="btn btn-outline-success btn-sm" v-on:click="ExportList(Object.keys(list)[0])">
                    <i class="bi bi-send-check"></i></button>
                    </button>
                </div>
            </div>
        
            <div class="row" v-for="card in list" id="cards">
                <div class="col" id="status_split">
                    <div class="row" id="pending_row">
                        <b id="pending_tasks">Pending Tasks</b>
                        <div id="card" v-for="i in card" :key="i.cid">
                            <div v-if="i.status == false">
                                <input :id="i.cid" type="checkbox" checked class="toggle">
                                <label :for="i.cid" class="drop"><b>{{i.task}}</b></label>
                                <div class="expand">
                                    <small><i>{{i.details}}</i></small><br/>
                                    <div class="btn-group btn-group-sm" role="group" aria-label="Small button group">
                                        <button title="Edit this Card" class="btn btn-outline-success btn-sm" v-on:click="ViewEditCardForm(Object.keys(list)[0],i.task,i)">
                                            <i class="bi bi-pen"></i>
                                        </button>
                                        <button title="Move this Card to another List" class="btn btn-outline-warning btn-sm" v-on:click="ViewMoveCardForm(Object.keys(list)[0],i.task,i)">
                                            <i class="bi bi-sign-turn-slight-right"></i>
                                        </button>
                                        <button title="Delete this Card" class="btn btn-outline-danger btn-sm" v-on:click="Deletecard(Object.keys(list)[0],i.task)">
                                            <i class="bi bi-trash3"></i>
                                        </button>
                                    </div>
                                    <small>
                                        <br/>Create on :{{i.create_time}}<br/>
                                        Deadline :{{i.deadline}}
                                    </small>
                                    <p id="pending">Status :Pending
                                        <button class="btn btn-outline-success btn-sm" v-on:click="SetCardAsComplete(Object.keys(list)[0],i.task,i)">
                                            <i class="bi bi-check2-square">Mark as completed</i>
                                        </button>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row" id="completed_row">
                        <b id="completed_tasks">Completed Task</b>
                        <div id="card" v-for="i in card" :key="i.cid">
                            <div v-if="i.status == true">
                                <input :id="i.cid" type="checkbox" checked class="toggle">
                                <label :for="i.cid" class="drop"><b>{{i.task}}</b></label>
                                <div class="expand">
                                    <small><i>{{i.details}}</i></small><br/>
                                    <div class="btn-group btn-group-sm" role="group" aria-label="Small button group">
                                        <button title="Edit this Card" class="btn btn-outline-success btn-sm" v-on:click="ViewEditCardForm(Object.keys(list)[0],i.task,i)">
                                            <i class="bi bi-pen"></i>
                                        </button>
                                        <button title="Move this Card to another List" class="btn btn-outline-warning btn-sm" v-on:click="ViewMoveCardForm(Object.keys(list)[0],i.task,i)">
                                            <i class="bi bi-sign-turn-slight-right"></i>
                                        </button>
                                        <button title="Delete this Card" class="btn btn-outline-danger btn-sm" v-on:click="Deletecard(Object.keys(list)[0],i.task)">
                                            <i class="bi bi-trash3"></i>
                                        </button>
                                    </div>
                                    <small>
                                        <br/>Create on :{{i.create_time}}<br/>
                                        Deadline :{{i.deadline}}
                                    </small>
                                    <p v-if="i.status == false" id="pending">Status :Pending
                                        <button class="btn btn-outline-success btn-sm" v-on:click="SetCardAsComplete(Object.keys(list)[0],i.task,i)">
                                            <i class="bi bi-check2-square">Mark as completed</i>
                                        </button>
                                    </p>
                                    <p v-else id="done">
                                        Completed on :{{i.completion_time}}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div> 
            </div>
        </div>
        

    </div>
    
        `,




    data: function() {
        return {
            email: "", // store current user email by mounted hook
            user: {}, // store current user object (have user details and list of trackers currently active forthem) by mounted hook
            card: {}, // to temporarly save card data
            addlist: null,  // for making add list form available
            addcardtolist: null, // ''
            editlist: null,
            editcardoflist: null,
            editcard: null,
            movecardoflist: null,
            movecard: null,
            usercards: [], // user card summary populated by mounted hook
        }
    },


    computed: {
        number_of_list: function() {
            return this.$store.state.userlists.length;
        },
        userlists: function() {
            return this.$store.state.userlists;
        },
        descrip: function() {
            return this.$store.state.descrip
        }
    },


    async mounted() {
        this.email = store.getters.getEmail;
        this.user = store.getters.getUser;
        this.usercards = store.getters.getUserCards;
    },





    methods: {
        async CreateList() { // function to create a new list
            if(confirm("Make sure List Name is unique.")){
                LnameEl = document.getElementById('NewListName') //return html element
                LdescriptionEl = document.getElementById('NewListDescription')
                Lname = LnameEl.value
                description = LdescriptionEl.value
                if (!Lname) {
                    alert('Tracker name required.');
                    return;
                  }
                  if (!description) {
                    alert('Description required.');
                    return;
                  }
                console.log(Lname, description)
                data = { "lname": Lname, "description":description };
                console.log(data)
                this.addlist = null //to make the form disapear
                url = "http://localhost:8080/user/list/"+this.email
                await fetch(url, {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Success:', data);
                })
                .catch((error) => {
                    console.error('Error:', error);
                });             
            }
            window.location.href = 'http://localhost:8080/you';
        },

        async CreateCard() { // function to create a new Card in a list
            if(confirm("Make sure Task Name is unique.")){
                TnameEl = document.getElementById('NewTaskName') //return html element
                TdetailsEl = document.getElementById('NewTaskDetails')
                TdeadlineEl = document.getElementById('NewTaskDeadline')
                task = TnameEl.value
                deadline = TdeadlineEl.value
                details = TdetailsEl.value
                let current = new Date();
                let cDate = current.getFullYear() + '-' + (current.getMonth() + 1) + '-' + current.getDate();
                // let cTime = current.getHours() + ":" + current.getMinutes() + ":" + current.getSeconds();
                create_time = cDate //+ ' ' + cTime;
                const date1 = new Date(deadline)
                const date2 = new Date(create_time)
                const diffTime = date1 - date2 // Math.abs(date1 - date2);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                if (!task) {
                    alert('Task name required.');
                    return;
                  }
                  if (!deadline) {
                    alert('Deadline required.');
                    return;
                  }
                  if (diffDays<0) {
                    alert('Deadline cannot be a past date');
                    return;
                  }
                console.log(task, deadline, create_time, diffDays)
                data = { "task": task, "details": details, "create_time":create_time, "deadline": deadline };
                console.log(data)
                this.addlist = null //to make the form disapear
                url = "http://localhost:8080/user/task/"+this.email+"/"+this.addcardtolist
                this.addcardtolist= null //to make the form disapear
                console.log(url)
                await fetch(url, {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Success:', data);
                })
                .catch((error) => {
                    console.error('Error:', error);
                });             
            }
            window.location.href = 'http://localhost:8080/you';
        },

        async Deletecard(lname,task) { // function to delete the selected card
            if(confirm("Do you really want to delete this list")){
                lname = lname
                task = task
                url = "http://localhost:8080/user/"+this.email+"/"+lname+"/"+task
                await fetch(url, {method: 'DELETE'})
                .then(response => response.json())
                .then(data => console.log(data));
            }
            window.location.href = 'http://localhost:8080/you';
        },

        async Deletelist(lname) { // function to delete the selected list
            if(confirm("Do you really want to delete this list. You can move existing cards to another list or even export the list details")){
                lname = lname
                url = "http://localhost:8080/user/"+this.email+"/"+lname
                await fetch(url, {method: 'DELETE'})
                .then(response => response.json())
                .then(data => console.log(data));
            }
            window.location.href = 'http://localhost:8080/you';
        },


        async EditList() { // function to edit the selected list
            if(confirm("If you change list name, make sure it is unique from your other lists.")){
                LnameEl = document.getElementById('EditListName')
                lname = LnameEl.value
                LdescriptionEl = document.getElementById('EditListDescription')
                description = LdescriptionEl.value
                if (!lname) {
                    alert('List Name required.');
                    return;
                  }
                if (!description) {
                    alert('Description required.');
                    return;
                  }
                console.log(lname, description);
                data = {"lname":lname, "description":description};
                console.log(data);
                url = "http://localhost:8080/user/"+this.email+"/"+this.editlist
                this.editlist = null //to make the form disapear
                await fetch(url, {
                    method: 'PUT',
                    headers: {
                    'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Success:', data);
                })
                .catch((error) => {
                    console.error('Error:', error);
                });      
            }
            window.location.href = 'http://localhost:8080/you';
        },

        async EditCard() { // function to edit a Card in a list
            if(confirm("Make sure Task Name is unique in this list.")){
                TnameEl = document.getElementById('EditTaskName') //return html element
                TdetailsEl = document.getElementById('EditTaskDetails')
                TdeadlineEl = document.getElementById('EditTaskDeadline')
                task = TnameEl.value
                details = TdetailsEl.value
                deadline = TdeadlineEl.value
                lid = this.card.lid
                create_time = this.card.create_time
                if (this.card.status == false){
                    tstatus = 0
                } else {
                    tstatus = 1
                }
                completion_time = this.card.completion_time
                const date1 = new Date(deadline)
                const date2 = new Date(create_time)
                const diffTime = date1 - date2
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                if (!task) {
                    alert('Task name required.');
                    return;
                  }
                  if (!deadline) {
                    alert('Deadline required.');
                    return;
                  }
                  if (diffDays<0) {
                    alert('Deadline cannot be a past date');
                    return;
                  }
                console.log(lid, task, deadline, create_time, diffDays, tstatus, completion_time)
                data = {"lid":lid, "task": task, "details": details, "deadline": deadline, "status": tstatus, "completion_time": completion_time };
                console.log(data)
                url = "http://localhost:8080/user/"+this.email+"/"+this.editcardoflist+"/"+this.editcard
                this.editcardoflist= null //to make the form disapear
                this.editcard= null
                this.card= {}
                console.log(url)
                await fetch(url, {
                    method: 'PUT',
                    headers: {
                    'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Success:', data);
                })
                .catch((error) => {
                    console.error('Error:', error);
                });             
            }
            window.location.href = 'http://localhost:8080/you';
        },

        Export() { //for user triggered job of sending CSV file of all cards
            if(confirm("All your card details will be sent to your mail as CSV file")){
                fetch("http://localhost:8080/user/export/"+this.email)
            }
        },

        ExportList(lname) { //for user triggered job of sending CSV file of a list
            if(confirm("All your card details in this List will be sent to your mail as CSV file")){
                lname = lname
                fetch("http://localhost:8080/user/export/"+this.email+"/"+lname)
            }
        },

        async MoveCard(lid) { // function to move a Card to another list
            if(confirm("Make sure the selected list doesnt have a task of this name.")){
                lid=lid
                task = this.card.task
                details = this.card.details
                deadline = this.card.deadline
                create_time = this.card.create_time
                if (this.card.status == false){
                    tstatus = 0
                } else {
                    tstatus = 1
                }
                completion_time = this.card.completion_time
                console.log(lid, task, deadline, create_time, tstatus, completion_time)
                data = {"lid":lid, "task": task, "details": details, "deadline": deadline, "status": tstatus, "completion_time": completion_time };
                console.log(data)
                url = "http://localhost:8080/user/"+this.email+"/"+this.movecardoflist+"/"+this.movecard
                this.movecardoflist= null //to make the form disapear
                this.movecard= null
                this.card= {}
                console.log(url)
                await fetch(url, {
                    method: 'PUT',
                    headers: {
                    'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Success:', data);
                })
                .catch((error) => {
                    console.error('Error:', error);
                });             
            }
            window.location.href = 'http://localhost:8080/you';
        },

        NoMoreList(){ //Alert showing max 5 list is available for a user
            alert("Cannot add more lists, Only a maximum of 5 list is allowed. But you can add as many cards in each list")
        },

        async SetCardAsComplete(lname, cname, card) { // function to change status of a card as completed
            if(confirm("Do you want to mark the task completed?")){
                this.card= card
                lid=this.card.lid
                task = this.card.task
                details = this.card.details
                deadline = this.card.deadline
                create_time = this.card.create_time
                tstatus = 1
                let current = new Date();
                let completion_time = current.getFullYear() + '-' + (current.getMonth() + 1) + '-' + current.getDate();
                console.log(lid, task, deadline, create_time, tstatus, completion_time)
                data = {"lid":lid, "task": task, "details": details, "deadline": deadline, "status": tstatus, "completion_time": completion_time };
                console.log(data)
                url = "http://localhost:8080/user/"+this.email+"/"+lname+"/"+cname
                this.card= {}
                console.log(url)
                await fetch(url, {
                    method: 'PUT',
                    headers: {
                    'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Success:', data);
                })
                .catch((error) => {
                    console.error('Error:', error);
                });             
            }
            window.location.href = 'http://localhost:8080/you';
        },

        Viewaddlistform() { //function to make add list form available
            if(confirm("Do you want to add new list")){
                this.addlist = "Add";
                this.editlist = null; //to make other forms disapear
                this.addcardtolist = null;
                this.editcard = null;
                this.movecard = null;
            }
        },

        Viewaddcardform(lname) { //function to make add list form available
            if(confirm("Do you want to add new task to this list")){
                this.addcardtolist = lname;
                this.addlist = null; //to make other forms disapear
                this.editlist = null;
                this.editcard = null;
                this.movecard = null;
            }
        },

        ViewEditCardForm(lname, cname, card) { //function to make Edit card form available
            if(confirm("Do you want to edit this card?")){
                this.editcardoflist = lname;
                this.editcard = cname;
                this.card = card;
                this.addlist = null; //to make other forms disapear
                this.editlist = null;
                this.addcardtolist = null;
                this.movecard = null;
                console.log("lname =", this.editcardoflist);
                console.log("cname =", this.editcard);
                console.log("card =", this.card);
            }
        },

        ViewEditListForm(lname) { //function to make Edit list form available
            if(confirm("Do you want to edit this list? (Only discription can be changed. Task name cannot be changed)")){
                this.editlist = lname;
                this.addlist = null; //to make other forms disapear
                this.addcardtolist = null;
                this.editcard = null;
                this.movecard = null;
            }
        },

        ViewMoveCardForm(lname, cname, card) { //function to make Edit list form available
            if(confirm("Do you want to edit this card?")){
                this.movecardoflist = lname;
                this.movecard = cname;
                this.card = card;
                this.addlist = null; //to make other forms disapear
                this.editlist = null;
                this.addcardtolist = null;
                this.editcard = null;
                console.log("lname =", this.movecardoflist);
                console.log("cname =", this.movecard);
                console.log("card =", this.card);
            }
        }
    }
})  

const routes = [
    {
        path: '/',
        component: Dashboard
    },{
        path: '/summary',
        component: Summary
    },{
        path: '/about',
        component: About
    }
];

const router = new VueRouter({
    routes // short for `routes: routes`
})



Vue.config.devtools = true

var app = new Vue({
    el:"#testingVue",
    router: router,
    store: store,

    //delimeters: ['${','}'],
    data() {
        return {
            msg: "Testing Vue.js",
            fetchdate: {}
        }
    },


    async created() { //fetch data on login and save to vuex store
        this.$store.commit('setEmail', document.getElementById('email').getAttribute('data-value')); // ascessing login user email from sidebar.html
        // console.log("current user email=", this.$store.state.email)
        url = "http://localhost:8080/user/"+this.$store.state.email
        token = window.localStorage.getItem("auth_token")
        await fetch(url, {headers: {'Content-Type': 'application/json', 'Authentication-Token': token} } ) //Fetching current user details from database
        .then(response => response.json())
        .then(data => this.$store.commit('setUser', data));
        // console.log("current user=", this.$store.state.user)
        // console.log("current useremail=", this.$store.state.user.email)
    },


    async beforeMount() { //fetch data on login and save to vuex store
        url = "http://localhost:8080/user/summary/"+this.$store.state.email
        token = window.localStorage.getItem("auth_token")
        await fetch(url, {headers: {'Content-Type': 'application/json', 'Authentication-Token': token} } )
        .then(response => response.json())
        .then(data => this.$store.commit('setUserLists', data)); // storing current user's active lists to userlists array
        // console.log("current userlist=", this.$store.state.userlists)
        for (const i of store.getters.getUserLists){
            // console.log('list iter=', i.lname)
            url = "http://localhost:8080/user/summary/"+this.$store.state.email+"/"+i.lname
            token = window.localStorage.getItem("auth_token")
            await fetch(url, {headers: {'Content-Type': 'application/json', 'Authentication-Token': token} } )
            .then(response => response.json())
            .then(data => this.fetchdate = data); // storing current user's cards into curresponding list of usercards object
            var obj = {};
            obj[i.lname] = this.fetchdate;
            this.$store.commit('setUserCards', obj)
            // console.log("user cards", this.$store.state.usercards)
        }
        for (x of store.getters.getUserLists){
            var obj = {};
            obj[x.lname] = x.description;
            this.$store.commit('setDescrip', obj)
        }
    },


});
