let objects = {
  name: "Lukman",
  age: 23,
  job: "LP",
  state: "Kwara",
  country: "Nigeria",
};

function filterObj(objs, ...fields) {
  let newObj = Object.keys(objs).forEach((el) => {
    if (!el.includes(fields)) {
      console.log("wrong");
    } else {
      console.log("right");
    }
  });
  //   console.log(newObj);
}

filterObj(objects, "name", "age");
