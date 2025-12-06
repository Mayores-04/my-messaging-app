"use client";

import {
  Authenticated,
  Unauthenticated,
  useQuery,
  useMutation,
} from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { api } from "../convex/_generated/api";
import React from "react";
import { useState } from "react";

export default function Home() {
  return (
    <>
      <Authenticated>
        <UserButton />
        <Content />
      </Authenticated>
      <Unauthenticated>
        <SignInButton />
      </Unauthenticated>
    </>
  );
}

function Content() {
  const createTask = useMutation(api.tasks.create);
  const tasks = useQuery(api.tasks.getAllTasks);

  const messages = useQuery(api.messages.getForCurrentUser);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");

  const handleChangeTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTaskTitle(e.target.value);
  };
  const handleChangeDescription = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setTaskDescription(e.target.value);
  };

  const addTask = async (taskTitle: string, taskDescription: string) => {
    await createTask({ taskTitle, taskDescription });
  };

  const archiveTask = useMutation(api.tasks.archive);
  const archive = async (taskId: Number) => {
    await archiveTask({ taskId: taskId });
  };

  const [filterTasks, setFilteredTasks] = useState("All");

  const filteredTasks = React.useMemo(() => {
    if (!tasks) return [];
    if (filterTasks === "All") {
      return tasks;
    } else if (filterTasks === "Active") {
      return tasks.filter((task) => task.archived === false);
    } else {
      return tasks.filter((task) => task.archived === true);
    }
  }, [tasks, filterTasks]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="w-full max-w-3xl">
        <div className="mb-6 text-sm text-gray-600">
          Authenticated content:{" "}
          {messages === undefined ? "Loading…" : messages.length}
        </div>
        <div className="flex flex-col">
          <div className="flex flex-row">
            <label htmlFor="taskTitle">Title:</label>
            <input
              type="text"
              name="taskTitle"
              title="Task title"
              placeholder="Enter title"
              value={taskTitle}
              onChange={handleChangeTitle}
            />
          </div>
          <div className="flex flex-row">
            <label htmlFor="taskDescription">Description:</label>
            <textarea
              name="taskDescription"
              title="Task description"
              placeholder="Enter description"
              value={taskDescription}
              onChange={handleChangeDescription}
            ></textarea>
          </div>
        </div>
        <button onClick={() => addTask(taskTitle, taskDescription)}>
          Add Task
        </button>

        <section className="mb-6 bg-white/5 rounded-lg p-4">
          <div className="flex flex-row justify-around">
            <button onClick={() => setFilteredTasks("All")}>All</button>
            <button onClick={() => setFilteredTasks("Active")}>Active</button>
            <button onClick={() => setFilteredTasks("Inactive")}>
              Inactive
            </button>
          </div>
          {filteredTasks.length > 0 ? (
            <ul className="list-disc pl-5">
              {filteredTasks.map(({ _id, title, description, archived }) => (
                <div key={_id} className="flex flex-row justify-between">
                  <li>{title}</li>
                  <li>{description}</li>
                  <button
                    onClick={() => archive(_id)}
                    className={`ml-4 px-2 py-1 rounded ${archived ? "bg-gray-500 text-white" : "bg-blue-500 text-white"}`}
                  >
                    {archived === true ? "Archived" : "Archive"}
                  </button>
                </div>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-500">No tasks yet.</div>
          )}
        </section>

        <section className="bg-white/5 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Messages</h2>
          {messages === undefined ? (
            <div className="text-sm text-gray-500">Loading messages…</div>
          ) : messages.length === 0 ? (
            <div className="text-sm text-gray-500">No messages yet.</div>
          ) : (
            <ul className="space-y-2">
              {messages.map((m: any) => (
                <>
                  <li
                    key={m._id ? String(m._id) : JSON.stringify(m)}
                    className="text-sm"
                  >
                    {m.body ?? JSON.stringify(m)}
                  </li>
                </>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
