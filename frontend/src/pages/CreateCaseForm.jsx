import { useEffect, useState } from "react";
import { DeleteOutlined } from "@ant-design/icons";
import {
  PartyDynamicInputs,
  DynamicInputArrays,
  TextAreaInput,
} from "../components/DynamicInputs";
import useClientSelectOptions from "../hooks/useClientSelectOptions";

import {
  Button,
  Input,
  Form,
  Divider,
  Typography,
  Card,
  Select,
  Switch,
  Space,
  DatePicker,
} from "antd";

import {
  courtOptions,
  statusOptions,
  natureOfCaseOptions,
  caseCategoryOptions,
  casePriorityOptions,
  modesOptions,
} from "../data/options";
import useUserSelectOptions from "../hooks/useUserSelectOptions";
import { caseInitialValue } from "../utils/initialValues";
import useHandleSubmit from "../hooks/useHandleSubmit";
import "react-quill/dist/quill.snow.css";
import { toast } from "react-toastify";

const CreateCaseForm = () => {
  const [formData, setFormData] = useState(caseInitialValue);
  const { userData } = useUserSelectOptions();
  const { clientOptions } = useClientSelectOptions();
  const { form, onSubmit, data, loading, error } = useHandleSubmit(
    "cases",
    "post"
  );

  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());

  // handle error and success
  useEffect(() => {
    if (error) {
      toast.error(error || "An error occurred");
    }
    if (data) {
      toast.success(data?.message || "Operation successful");
    }
  }, [error, data]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Form
        layout="vertical"
        form={form}
        name="dynamic_form_complex"
        className="space-y-6">
        {/* First Party */}
        <section className="bg-gray-50 p-4 rounded-lg shadow">
          <Divider orientation="left" orientationMargin="0">
            <Typography.Title level={4}>First Party</Typography.Title>
          </Divider>
          <PartyDynamicInputs
            parentKey="firstParty"
            firstKeyVal="description"
            label="Description"
            placeholderVal="e.g. Plaintiff"
            secondKeyVal="name"
            firstInitialValue={formData?.firstParty?.description}
            secondInitialValue={formData?.firstParty?.name}
            thirdKeyVal="processesFiled"
            thirdInitialValue={formData?.firstParty?.processesFiled}
          />
        </section>

        {/* Second Party */}
        <section className="bg-gray-50 p-4 rounded-lg shadow">
          <Divider orientation="left" orientationMargin="0">
            <Typography.Title level={4}>Second Party</Typography.Title>
          </Divider>
          <PartyDynamicInputs
            parentKey="secondParty"
            firstKeyVal="description"
            label="Description"
            placeholderVal="e.g. Defendant"
            secondKeyVal="name"
            firstInitialValue={formData?.secondParty?.description}
            secondInitialValue={formData?.secondParty?.name}
            thirdKeyVal="processesFiled"
            thirdInitialValue={formData?.secondParty?.processesFiled}
          />
        </section>

        {/* Other Parties */}
        {/* Other Parties */}
        <section className="bg-gray-50 p-4 rounded-lg shadow">
          <Divider orientation="left" orientationMargin="0">
            <Typography.Title level={4}>Other Party</Typography.Title>
          </Divider>
          <Form.List name="otherParty">
            {(fields, { add, remove }) => (
              <div className="space-y-4">
                {fields.map((field) => (
                  <Card
                    className="bg-white"
                    size="small"
                    title={`Other Parties ${field.name + 1}`}
                    key={field.key}
                    extra={
                      <DeleteOutlined
                        className="text-red-700 cursor-pointer"
                        onClick={() => remove(field.name)}
                      />
                    }>
                    <div className="space-y-4">
                      <Form.Item
                        label="Description"
                        name={[field.name, "description"]}
                        initialValue={formData.otherParty.description}>
                        <Input />
                      </Form.Item>

                      <Form.Item label="Name" className="mb-0">
                        <Form.List name={[field.name, "name"]}>
                          {(
                            subFields,
                            { add: addName, remove: removeName }
                          ) => (
                            <div className="space-y-2">
                              {subFields.map((subField) => (
                                <Space.Compact
                                  key={subField.key}
                                  className="flex w-full">
                                  <Form.Item
                                    noStyle
                                    name={[subField.name, "name"]}
                                    initialValue={
                                      formData.otherParty[field.name]?.name[
                                        subField?.name
                                      ]?.name
                                    }>
                                    <Input
                                      className="flex-grow"
                                      placeholder="Enter Party's name"
                                    />
                                  </Form.Item>
                                  <Button
                                    onClick={() => removeName(subField.name)}>
                                    <DeleteOutlined className="text-red-700" />
                                  </Button>
                                </Space.Compact>
                              ))}
                              <Button
                                type="dashed"
                                onClick={() => addName()}
                                block>
                                + Add Name
                              </Button>
                            </div>
                          )}
                        </Form.List>
                      </Form.Item>

                      <Form.Item label="Processes Filed" className="mb-0">
                        <Form.List name={[field.name, "processesFiled"]}>
                          {(
                            subFields,
                            { add: addProcess, remove: removeProcess }
                          ) => (
                            <div className="space-y-2">
                              {subFields.map((subField) => (
                                <Space.Compact
                                  key={subField.key}
                                  className="flex w-full">
                                  <Form.Item
                                    noStyle
                                    name={[subField.name, "name"]}
                                    initialValue={
                                      formData.otherParty[field.name]
                                        ?.processesFiled[subField.name]?.name
                                    }>
                                    <Input
                                      className="flex-grow"
                                      placeholder="Enter Processes filed by the party"
                                    />
                                  </Form.Item>
                                  <Button
                                    onClick={() =>
                                      removeProcess(subField.name)
                                    }>
                                    <DeleteOutlined className="text-red-700" />
                                  </Button>
                                </Space.Compact>
                              ))}
                              <Button
                                type="dashed"
                                onClick={() => addProcess()}
                                block>
                                + Add Process
                              </Button>
                            </div>
                          )}
                        </Form.List>
                      </Form.Item>
                    </div>
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add()} className="w-full">
                  + Add More Parties
                </Button>
              </div>
            )}
          </Form.List>
        </section>

        {/* Case Details */}
        <section className="bg-gray-50 p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="modeOfCommencement"
              label="Mode of Commencement"
              initialValue={formData?.modeOfCommencement}>
              <Select
                placeholder="Select mode"
                showSearch
                filterOption={filterOption}
                options={modesOptions}
                allowClear
                className="w-full"
              />
            </Form.Item>

            {/* <Form.Item
              label="Specify Mode"
              name="otherModeOfCommencement"
              initialValue={formData?.otherModeOfCommencement}>
              <Input />
            </Form.Item> */}

            <Form.Item
              label="Filed by Office"
              valuePropName="checked"
              name="isFiledByTheOffice"
              initialValue={formData?.isFiledByTheOffice}>
              <Switch className="bg-gray-400" />
            </Form.Item>

            <Form.Item
              name="natureOfCase"
              label="Nature of Case"
              initialValue={formData?.natureOfCase}>
              <Select
                placeholder="Select nature of case"
                showSearch
                filterOption={filterOption}
                options={natureOfCaseOptions}
                allowClear
                className="w-full"
              />
            </Form.Item>

            <Form.Item name="filingDate" label="Filing Date">
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item
              name="suitNo"
              label="Suit No."
              tooltip="This is a required field"
              initialValue={formData?.suitNo}>
              <Input />
            </Form.Item>
          </div>
        </section>

        {/* Court Information */}
        <section className="bg-gray-50 p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Form.Item
              name="courtName"
              label="Court"
              initialValue={formData?.courtName}>
              <Select
                placeholder="Select court"
                showSearch
                filterOption={filterOption}
                options={courtOptions}
                allowClear
                className="w-full"
              />
            </Form.Item>

            <Form.Item
              label="Court No"
              name="courtNo"
              initialValue={formData?.courtNo}>
              <Input />
            </Form.Item>

            <Form.Item
              label="Court's Location"
              name="location"
              placeholder="e.g. Ikoyi, Lagos"
              initialValue={formData?.location}>
              <Input />
            </Form.Item>

            <Form.Item
              label="State"
              name="state"
              placeholder="e.g. Lagos"
              initialValue={formData?.state}>
              <Input />
            </Form.Item>
            {/* 
            <Form.Item
              label="Specify Court"
              name="otherCourt"
              initialValue={formData?.courtName}>
              <Input />
            </Form.Item> */}

            <Form.Item
              label="Case file Number"
              name="caseOfficeFileNo"
              initialValue={formData?.caseOfficeFileNo}>
              <Input />
            </Form.Item>
          </div>
        </section>

        {/* Case Status and Category */}
        <section className="bg-gray-50 p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Form.Item
              name="caseStatus"
              label="Case Status"
              initialValue={formData?.caseStatus}>
              <Select
                placeholder="Select case status"
                showSearch
                filterOption={filterOption}
                options={statusOptions}
                allowClear
                className="w-full"
              />
            </Form.Item>

            <Form.Item
              name="category"
              label="Case Category"
              initialValue={formData?.category}>
              <Select
                placeholder="Select case category"
                showSearch
                filterOption={filterOption}
                options={caseCategoryOptions}
                allowClear
                className="w-full"
              />
            </Form.Item>

            <Form.Item
              name="casePriority"
              label="Case Priority/Rating"
              initialValue={formData?.casePriority}>
              <Select
                placeholder="Select case priority"
                showSearch
                filterOption={filterOption}
                options={casePriorityOptions}
                allowClear
                className="w-full"
              />
            </Form.Item>
          </div>
        </section>

        {/* Additional Information */}
        <section className="bg-gray-50 p-4 rounded-lg shadow space-y-4">
          <DynamicInputArrays
            parentKey="judge"
            initialValue={formData?.judge}
            label="Judge/Justices"
            placeholder="Enter judges name"
          />

          <DynamicInputArrays
            parentKey="caseStrengths"
            initialValue={formData?.caseStrengths}
            label="Case Strength"
            placeholder="Enter case's Strength"
          />

          <DynamicInputArrays
            parentKey="caseWeaknesses"
            initialValue={formData?.caseWeaknesses}
            label="Case Weaknesses"
            placeholder="Enter case's Weaknesses"
          />

          <DynamicInputArrays
            parentKey="stepToBeTaken"
            initialValue={formData?.stepToBeTaken}
            label="Steps/Strategies"
          />
        </section>

        {/* Account Officer and Client */}
        <section className="bg-gray-50 p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="accountOfficer"
              label="Account Officer"
              initialValue={formData?.accountOfficer.name}>
              <Select
                mode="multiple"
                placeholder="Select account officer"
                options={userData}
                allowClear
                className="w-full"
              />
            </Form.Item>

            <Form.Item
              name="client"
              label="Client"
              initialValue={formData?.client}>
              <Select
                mode="multiple"
                placeholder="Select client..."
                options={clientOptions}
                allowClear
                className="w-full"
              />
            </Form.Item>
          </div>
        </section>

        {/* Case Summary and General Comment */}
        <section className="bg-gray-50 p-4 rounded-lg shadow space-y-4">
          <TextAreaInput
            fieldName="caseSummary"
            initialValue={formData?.caseSummary}
            label="Case Summary"
          />
          <TextAreaInput
            fieldName="generalComment"
            initialValue={formData?.generalComment}
            label="General Comment"
          />
        </section>

        <Form.Item>
          <Button
            loading={loading}
            onClick={onSubmit}
            type="primary"
            htmlType="submit"
            className="w-full bg-blue-500 hover:bg-blue-600">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default CreateCaseForm;
