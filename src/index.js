const fs = require('fs');

function transformTimeToMinutes(time) {
  return parseInt(time.split(":")[0]) * 60 + parseInt(time.split(":")[1]);
}

function extractHoursAndMinutes(time) {
  return {
    hour: parseInt(time.split(":")[0]),
    minute: parseInt(time.split(":")[1]),
    minutesAbs: transformTimeToMinutes(time),
  };
}

function transformMinutesToTime(minutes) {
  const hours = (Math.floor(minutes / 60)).toString().padStart(2, "0");
  const mins = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

function calculateFreeSlots(start, end, slots) {

  const startWorkingDay = extractHoursAndMinutes(start);
  const endWorkingDay = extractHoursAndMinutes(end);
  const firstSlot = slots[0];
  const lastSlot = slots[slots.length - 1];

  const virtualFirst = {
    starts_at: transformMinutesToTime(Math.min(startWorkingDay.minutesAbs, extractHoursAndMinutes(firstSlot.starts_at).minutesAbs)),
    ends_at: transformMinutesToTime(Math.min(startWorkingDay.minutesAbs, extractHoursAndMinutes(firstSlot.starts_at).minutesAbs)),
    minutesAbs: Math.min(startWorkingDay.minutesAbs, extractHoursAndMinutes(firstSlot.starts_at).minutesAbs),
    type: "VIRTUAL",
  };

  const virtualLast = {
    starts_at: transformMinutesToTime(Math.max(endWorkingDay.minutesAbs, extractHoursAndMinutes(lastSlot.ends_at).minutesAbs)),
    ends_at: transformMinutesToTime(Math.max(endWorkingDay.minutesAbs, extractHoursAndMinutes(lastSlot.ends_at).minutesAbs)),
    minutesAbs: Math.max(endWorkingDay.minutesAbs, extractHoursAndMinutes(lastSlot.ends_at).minutesAbs),
    type: "VIRTUAL",
  };

  const allSlots = [virtualFirst, ...slots.map(slot => {
    return {
      starts_at: slot.starts_at,
      ends_at: slot.ends_at,
      minutesAbs: extractHoursAndMinutes(slot.starts_at).minutesAbs,
      type: slot.type,
    };
  }), virtualLast];

  const withFreeSlots = [];

  for (let slotIndex = 0;  slotIndex < allSlots.length - 1; slotIndex++) {
    const currentSlot = allSlots[slotIndex];
    const nextSlot = allSlots[slotIndex + 1];

    const currentSlotEnd = transformTimeToMinutes(currentSlot.ends_at);
    const nextSlotStart = transformTimeToMinutes(nextSlot.starts_at);

    withFreeSlots.push(currentSlot);

    if (currentSlotEnd < nextSlotStart) {
      withFreeSlots.push({
        starts_at: currentSlot.ends_at,
        ends_at: nextSlot.starts_at,
        minutesAbs: currentSlotEnd,
        type: "FREE",
      });
    }
  }

  return withFreeSlots.filter(slot => slot.type !== "VIRTUAL");
}

const testData = fs.readFileSync("src/tests.json", "utf8");
const tests = JSON.parse(testData);

tests.forEach(test => {
  console.log(" === ",test.title, " === ");
  console.log(calculateFreeSlots(test.workingDayStart, test.workingDayEnd, test.slots));
})
