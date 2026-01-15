/**
 * CalendarView Component
 * Displays tasks in a calendar format using FullCalendar
 * Supports month, week, and day views with role-based filtering
 */
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { tasksAPI } from '../services/api';

const CalendarView = ({ onError }) => {
  // State management
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);

  /**
   * Load tasks for calendar view
   */
  const loadCalendarTasks = React.useCallback(async () => {
    setLoading(true);
    try {
      // Get current month start and end dates
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString().split('T')[0];

      // Fetch tasks for calendar
      const tasks = await tasksAPI.getCalendarTasks(startDate, endDate);
      
      // Convert tasks to FullCalendar events
      // Show tasks on both due_date and assigned_at dates
      const calendarEvents = [];
      
      tasks.forEach(task => {
        // Add event for due date if it exists
        if (task.due_date) {
          calendarEvents.push({
            id: `${task.id}-due`,
            title: `${task.title} (Due)`,
            start: task.due_date,
            allDay: true,
            backgroundColor: getStatusColor(task.status),
            borderColor: getStatusColor(task.status),
            extendedProps: {
              task: task,
              type: 'due_date',
            },
          });
        }
        
        // Add event for assignment date if it exists
        if (task.assigned_at) {
          const assignedDate = new Date(task.assigned_at).toISOString().split('T')[0];
          calendarEvents.push({
            id: `${task.id}-assigned`,
            title: `${task.title} (Assigned)`,
            start: assignedDate,
            allDay: true,
            backgroundColor: getAssignmentColor(), // Purple color for assignment events
            borderColor: getAssignmentColor(),
            extendedProps: {
              task: task,
              type: 'assigned_at',
            },
          });
        }
      });

      setEvents(calendarEvents);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to load calendar tasks';
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Load tasks for calendar on component mount and when view changes
  useEffect(() => {
    loadCalendarTasks();
  }, [loadCalendarTasks]);

  /**
   * Handle calendar view change - reload tasks for new date range
   */
  const handleDatesSet = async (arg) => {
    try {
      const startDate = arg.start.toISOString().split('T')[0];
      const endDate = arg.end.toISOString().split('T')[0];
      
      // Fetch tasks for the visible date range
      const tasks = await tasksAPI.getCalendarTasks(startDate, endDate);
      
      // Convert tasks to FullCalendar events
      const calendarEvents = tasks
        .filter(task => task.due_date) // Only include tasks with due dates
        .map(task => ({
          id: task.id.toString(),
          title: task.title,
          start: task.due_date,
          allDay: true,
          backgroundColor: getStatusColor(task.status),
          borderColor: getStatusColor(task.status),
          extendedProps: {
            task: task,
          },
        }));

      setEvents(calendarEvents);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to load calendar tasks';
      if (onError) onError(errorMessage);
    }
  };

  /**
   * Get color based on task status
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#10b981'; // green
      case 'inprogress':
        return '#3b82f6'; // blue
      case 'todo':
        return '#f59e0b'; // yellow
      default:
        return '#6b7280'; // gray
    }
  };

  /**
   * Get color for assignment events
   */
  const getAssignmentColor = () => {
    return '#8b5cf6'; // Purple color for assignment events
  };

  /**
   * Handle date click - show tasks for selected date
   */
  const handleDateClick = async (arg) => {
    try {
      const clickedDate = arg.dateStr;
      setSelectedDate(clickedDate);
      
      // Filter tasks for the clicked date (both due_date and assigned_at)
      const tasksForDate = events
        .filter(event => {
          const eventDate = event.start instanceof Date 
            ? event.start.toISOString().split('T')[0]
            : event.start.split('T')[0];
          return eventDate === clickedDate;
        })
        .map(event => event.extendedProps.task);
      
      // Remove duplicates (same task might appear for both due_date and assigned_at)
      const uniqueTasks = Array.from(
        new Map(tasksForDate.map(task => [task.id, task])).values()
      );
      
      setSelectedTasks(uniqueTasks);
    } catch (error) {
      console.error('Error handling date click:', error);
    }
  };

  /**
   * Handle event click - show task details
   */
  const handleEventClick = (arg) => {
    const task = arg.event.extendedProps.task;
    setSelectedDate(arg.event.startStr);
    setSelectedTasks([task]);
  };

  return (
    <div>
      {/* Calendar Container */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            height="auto"
            eventDisplay="block"
            dayMaxEvents={3}
            moreLinkClick="popover"
            editable={false}
            selectable={true}
            weekends={true}
            locale="en"
          />
        )}
      </div>

      {/* Selected Date Tasks Modal */}
      {selectedDate && selectedTasks.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  Tasks for {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h3>
                <button
                  onClick={() => {
                    setSelectedDate(null);
                    setSelectedTasks([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {selectedTasks.map(task => (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">{task.title}</h4>
                    <p className="text-gray-600 text-sm mb-3">{task.description || 'No description'}</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className={`px-3 py-1 rounded-full ${getStatusBadgeClass(task.status)}`}>
                        {task.status?.replace('_', ' ').toUpperCase() || 'TODO'}
                      </span>
                      {task.due_date && (
                        <span className="text-gray-500">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                      {/* Overdue label */}
                      {task.is_overdue && (
                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium text-xs">
                          OVERDUE
                        </span>
                      )}
                      {task.assigned_at && (
                        <span className="text-gray-500">
                          Assigned: {new Date(task.assigned_at).toLocaleDateString()} {new Date(task.assigned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {task.assigned_to && (
                        <span className="text-gray-500">
                          Assigned to: {task.assigned_to.first_name && task.assigned_to.last_name
                            ? `${task.assigned_to.first_name} ${task.assigned_to.last_name}`
                            : task.assigned_to.username || task.assigned_to.email}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No tasks message */}
      {selectedDate && selectedTasks.length === 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  Tasks for {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h3>
                <button
                  onClick={() => {
                    setSelectedDate(null);
                    setSelectedTasks([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-500 text-center py-8">No tasks scheduled for this day</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Get status badge styling
 */
const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700';
    case 'inprogress':
      return 'bg-blue-100 text-blue-700';
    case 'todo':
      return 'bg-yellow-100 text-yellow-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export default CalendarView;

