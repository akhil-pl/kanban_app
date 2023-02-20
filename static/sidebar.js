Vue.component('user-detail', {
    template: `
    <div>
        <h3> Hi, {{ user['uname'] }}</h3>
        <button v-on:click="UserDel" class="btn btn-outline-danger btn-sm">Delete<i class="bi bi-person-x"></i></button>
        <div class="openBtn">
            <button class="btn btn-outline-success btn-sm" v-on:click="openForm">Edit<i class="bi bi-person-lines-fill"></i></button>
        </div>
        <h5>{{user['gender']}} aged {{age}}</h5>


        
        <div class="loginPopup">
            <div class="formPopup" id="popupForm">
            <form action="/action_page.php" class="formContainer">
                <h2>Profile Edit Form</h2>

                <label for="UserName"><strong>Name</strong></label>
                <input type="text" id="UserName" placeholder="Your Name" name="email" required>
                
                <label for="UserGender"><strong>Gender</strong></label>
                <input type="text" id="UserGender" placeholder="Your Gender" name="psw" required>

                <label for="UserDob"><strong>DOB</strong></label>
                <input type="date" id="UserDob" name="psw" required>
                
                <button type="button" class="btn"  v-on:click="UserEdit">Save Changes</button>
                <button type="button" class="btn cancel" v-on:click="closeForm">Close Form</button>
            </form>
        </div>
    </div>
    
    </div>
        `,
    data: function () {
        return {
            email: "", // store current user email by created hook
            user: {}, // store current user object by created hook
        }
    },

    computed: {
        age: function () {
            dob = this.user.dob
            let current = new Date();
            let cDate = current.getFullYear() + '-' + (current.getMonth() + 1) + '-' + current.getDate();
            const date1 = new Date(dob)
            const date2 = new Date(cDate)
            const diffTime = Math.abs(date1 - date2);
            const years = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365))
            return years
        }
    },

    async created() {
        this.email = document.getElementById('email').getAttribute('data-value'); // ascessing login user email from sidebar.html
        url = "http://localhost:8080/user/" + this.email
        token = window.localStorage.getItem("auth_token")
        await fetch(url, { headers: { 'Content-Type': 'application/json', 'Authentication-Token': token } }) //Fetching current user details from database
            .then(response => response.json())
            .then(data => this.user = data);
    },

    methods: {
        async UserDel() { // function to delete the current user
            if (confirm("Do you really want to delete your account. You can export your list details before deleting.")) {
                url = "http://localhost:8080/user/" + this.email
                await fetch(url, { method: 'DELETE' })
                    .then(response => response.json())
                    .then(data => console.log(data));
            }
            window.location.href = 'http://localhost:8080/you';
        },

        async UserEdit() { // function to edid current user data
            if (confirm("Do you want to edit your account details")) {
                UunameEl = document.getElementById('UserName') //return html element
                UgenderEl = document.getElementById('UserGender')
                UdobEl = document.getElementById('UserDob')
                uname = UunameEl.value
                gender = UgenderEl.value
                dob = UdobEl.value
                if (!uname) {
                    alert('User name required.');
                    return;
                }
                data = { "uname": uname, "gender": gender, "dob": dob };
                console.log(data)
                url = "http://localhost:8080/user/" + this.email
                this.edit = null
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

        openForm() {
            document.getElementById("popupForm").style.display = "block";
        },

        closeForm() {
            document.getElementById("popupForm").style.display = "none";
        }
    }
})




var app = new Vue({
    el: "#sidebar",
});