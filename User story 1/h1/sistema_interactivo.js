let name = prompt("Enter your name")
let age = prompt("Enter your age")

if (isNaN(age)){
    console.error("Error: Please, enter a valid age in number");
}
if (age<18){
    alert("Hi " + name + " You're underage. Keep learning and enjoying coding!");
}
if (age>=18){
    alert("Hi " + name + " You are of legal age. Get ready for great opportunities in the world of programming!");

};