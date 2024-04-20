import Button from "../components/Button";
// import Input from "../components/Inputs";
import { useFieldArray, useForm } from "react-hook-form";
import { DevTool } from "@hookform/devtools";

const Task = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm();

  const { fields, append, remove } = useFieldArray({
    name: "tasks",
    control,
  });

  const submitForm = (formData) => {
    console.log(formData);
  };

  return (
    <>
      <form onSubmit={handleSubmit(submitForm)} noValidate>
        <h1 className="text-4xl">Tasks Page</h1>
        <div className="form-control">
          <label
            htmlFor
            className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2 ">
            name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            {...register("name", {
              // required: true,
              minLength: {
                value: 7,
                message: "name must be at least 7 characters",
              },
            })} // Pass register output as props
          />
          <label
            htmlFor
            className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2 ">
            Price
          </label>
          <input
            className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2 "
            type="number"
            name="price"
            id="price"
            {...register("price", {
              valueAsNumber: true,
              validate: (value) =>
                value > 20 || "value must be greater than 20",
              message: "value must be divisible by 2",
              // required: true,
              // minLength: {
              //   value: 7,
              //   message: "name must be at least 7 characters",
              // },
            })} // Pass register output as props
          />
          <small className="text-red-600">
            {" "}
            {errors.name?.message}
            {/* {errors.name && errors.name.message} */}
          </small>
          <div>
            <small>{errors.price?.message}</small>
            {/* <small>{errors.price && errors.price.message}</small> */}
          </div>
        </div>

        <div>
          {fields.map((field, index) => {
            return (
              <>
                <div key={index}>
                  <label htmlFor="">Tasks</label>
                  <input
                    type="text"
                    {...register(`tasks.${index}.name`)}
                    id={`tasks[${index}].name`}
                  />
                </div>
                <div>
                  <label htmlFor="">todos</label>
                  <input
                    type="text"
                    {...register(`tasks.${index}.todos`)}
                    defaultValue="Input your todos"
                    id={`tasks[${index}].todos`}
                  />
                </div>
              </>
            );
          })}
        </div>

        <Button type="submit">Save</Button>
      </form>

      <DevTool control={control} />
    </>
  );
};

export default Task;
