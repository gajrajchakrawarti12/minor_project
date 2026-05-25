'use client';

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle, Plus } from "lucide-react";

import type { ApiError } from "@/shared/api/http";
import {
  createTimeSlot,
  deleteTimeSlot,
  listTimeSlots,
  updateTimeSlot,
  type TimeSlot,
  type TimeSlotPayload,
} from "./api/timeslotApi";

type TimeSlotFormState = {
  day: string;
  startTime: string;
  endTime: string;
};

const weekdayOptions = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const weekdayOrder = new Map(
  weekdayOptions.map((day, index) => [day, index]),
);

const initialFormState: TimeSlotFormState = {
  day: "",
  startTime: "",
  endTime: "",
};

const resolveErrorMessage = (error: unknown): string => {
  const apiError = error as ApiError;

  if (typeof apiError?.data === "string") {
    return apiError.data;
  }

  if (
    apiError?.data &&
    typeof apiError.data === "object" &&
    "message" in (apiError.data as object)
  ) {
    const serverMessage = (
      apiError.data as { message?: unknown }
    ).message;

    if (
      typeof serverMessage === "string" &&
      serverMessage.trim().length > 0
    ) {
      return serverMessage;
    }
  }

  if (
    apiError?.message &&
    apiError.message.trim().length > 0
  ) {
    return apiError.message;
  }

  if (
    error instanceof Error &&
    error.message.trim().length > 0
  ) {
    return error.message;
  }

  return "Something went wrong while processing the time slot request.";
};

const normalizeTimeForInput = (value: string): string => {
  const [hours, minutes] = value.split(":");

  if (!hours || !minutes) {
    return "";
  }

  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
};

const toApiTime = (value: string): string => {
  const normalized = normalizeTimeForInput(value);
  return normalized ? `${normalized}:00` : value;
};

const formatDay = (value: string): string => {
  if (!value) {
    return value;
  }

  return `${value.charAt(0)}${value
    .slice(1)
    .toLowerCase()}`;
};

const sortTimeSlots = (
  slots: TimeSlot[],
): TimeSlot[] => {
  return [...slots].sort((left, right) => {
    const leftDay =
      weekdayOrder.get(left.day) ??
      Number.MAX_SAFE_INTEGER;

    const rightDay =
      weekdayOrder.get(right.day) ??
      Number.MAX_SAFE_INTEGER;

    if (leftDay !== rightDay) {
      return leftDay - rightDay;
    }

    return left.start_time.localeCompare(
      right.start_time,
    );
  });
};

function TimeSlotPage() {
  const [timeSlots, setTimeSlots] = useState<
    TimeSlot[]
  >([]);

  const [selectedTimeSlotId, setSelectedTimeSlotId] =
    useState<number | null>(null);

  const [formState, setFormState] =
    useState<TimeSlotFormState>(
      initialFormState,
    );

  const [isLoading, setIsLoading] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [isDeleting, setIsDeleting] =
    useState(false);

  const [error, setError] = useState<
    string | null
  >(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const selectedTimeSlot = useMemo(
    () =>
      timeSlots.find(
        (slot) => slot.id === selectedTimeSlotId,
      ) ?? null,
    [timeSlots, selectedTimeSlotId],
  );

  const sortedTimeSlots = useMemo(
    () => sortTimeSlots(timeSlots),
    [timeSlots],
  );

  useEffect(() => {
    const loadTimeSlots = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await listTimeSlots();
        setTimeSlots(response);
      } catch (err) {
        setError(resolveErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    void loadTimeSlots();
  }, []);

  const resetForm = (
    preserveMessage = false,
  ) => {
    setSelectedTimeSlotId(null);

    setFormState(initialFormState);

    setError(null);

    if (!preserveMessage) {
      setSuccessMessage(null);
    }
  };

  const handleSelectTimeSlot = (
    slot: TimeSlot,
  ) => {
    setSelectedTimeSlotId(slot.id);

    setFormState({
      day: slot.day,
      startTime: normalizeTimeForInput(
        slot.start_time,
      ),
      endTime: normalizeTimeForInput(
        slot.end_time,
      ),
    });

    setError(null);
    setSuccessMessage(null);
  };

  const buildPayload =
    (): TimeSlotPayload | null => {
      const day = formState.day
        .trim()
        .toUpperCase();

      const startTime =
        normalizeTimeForInput(
          formState.startTime,
        );

      const endTime =
        normalizeTimeForInput(
          formState.endTime,
        );

      if (!weekdayOptions.includes(day)) {
        setError(
          "Please select a valid weekday.",
        );
        return null;
      }

      if (!startTime) {
        setError("Start time is required.");
        return null;
      }

      if (!endTime) {
        setError("End time is required.");
        return null;
      }

      if (startTime >= endTime) {
        setError(
          "Start time must be earlier than end time.",
        );
        return null;
      }

      return {
        day,
        start_time: toApiTime(startTime),
        end_time: toApiTime(endTime),
      };
    };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError(null);
    setSuccessMessage(null);

    const payload = buildPayload();

    if (!payload) {
      return;
    }

    setIsSaving(true);

    try {
      if (selectedTimeSlotId !== null) {
        const updated =
          await updateTimeSlot(
            selectedTimeSlotId,
            payload,
          );

        setTimeSlots((current) =>
          current.map((slot) =>
            slot.id === updated.id
              ? updated
              : slot,
          ),
        );

        resetForm(true);

        setSuccessMessage(
          "Time slot updated successfully.",
        );
      } else {
        const created =
          await createTimeSlot(payload);

        setTimeSlots((current) => [
          ...current,
          created,
        ]);

        resetForm(true);

        setSuccessMessage(
          "Time slot created successfully.",
        );
      }
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (selectedTimeSlotId === null) {
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to delete this time slot?",
      )
    ) {
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsDeleting(true);

    try {
      await deleteTimeSlot(
        selectedTimeSlotId,
      );

      setTimeSlots((current) =>
        current.filter(
          (slot) =>
            slot.id !== selectedTimeSlotId,
        ),
      );

      resetForm(true);

      setSuccessMessage(
        "Time slot deleted successfully.",
      );
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Time Slots
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Manage weekly scheduling
              slots
            </p>
          </div>

          <button
            type="button"
            onClick={() => resetForm()}
            className="flex items-center gap-2  bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Time Slot
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2  border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 flex items-start gap-2  border border-green-200 bg-green-50 p-4 text-green-700">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className=" border bg-white/10 p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">
              Time Slot List
            </h2>

            <div className="max-h-150 space-y-2 overflow-y-auto pr-1">
              {isLoading ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  Loading time slots...
                </div>
              ) : sortedTimeSlots.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  No time slots available
                </div>
              ) : (
                sortedTimeSlots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() =>
                      handleSelectTimeSlot(
                        slot,
                      )
                    }
                    className={`w-full  border p-4 text-left transition ${
                      selectedTimeSlotId ===
                      slot.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-500 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-semibold text-gray-900">
                      {formatDay(slot.day)}
                    </div>

                    <div className="mt-1 text-sm text-gray-500">
                      {normalizeTimeForInput(
                        slot.start_time,
                      )}{" "}
                      -{" "}
                      {normalizeTimeForInput(
                        slot.end_time,
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className=" border bg-white/10 p-6 shadow-sm">
              <h2 className="mb-6 text-2xl font-semibold text-gray-900">
                {selectedTimeSlot
                  ? `Edit ${formatDay(
                      selectedTimeSlot.day,
                    )}`
                  : "Create Time Slot"}
              </h2>

              <form
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Day
                  </label>

                  <select
                    name="day"
                    value={formState.day}
                    onChange={(event) =>
                      setFormState(
                        (current) => ({
                          ...current,
                          day: event.target.value,
                        }),
                      )
                    }
                    className="w-full  border border-gray-600 px-3 py-2 outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">
                      Select day
                    </option>

                    {weekdayOptions.map(
                      (day) => (
                        <option
                          key={day}
                          value={day}
                        >
                          {formatDay(day)}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Start Time
                    </label>

                    <input
                      type="time"
                      name="startTime"
                      value={
                        formState.startTime
                      }
                      onChange={(event) =>
                        setFormState(
                          (current) => ({
                            ...current,
                            startTime:
                              event.target
                                .value,
                          }),
                        )
                      }
                      className="w-full  border border-gray-500 px-3 py-2 outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      End Time
                    </label>

                    <input
                      type="time"
                      name="endTime"
                      value={
                        formState.endTime
                      }
                      onChange={(event) =>
                        setFormState(
                          (current) => ({
                            ...current,
                            endTime:
                              event.target
                                .value,
                          }),
                        )
                      }
                      className="w-full  border border-gray-500 px-3 py-2 outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1  bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving
                      ? "Saving..."
                      : selectedTimeSlot
                      ? "Update Time Slot"
                      : "Create Time Slot"}
                  </button>

                  {selectedTimeSlot && (
                    <button
                      type="button"
                      onClick={
                        handleDelete
                      }
                      disabled={
                        isDeleting
                      }
                      className="flex-1  bg-red-500 px-4 py-2 font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDeleting
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimeSlotPage;