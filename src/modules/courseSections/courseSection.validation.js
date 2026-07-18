const Joi = require("joi");

const courseSectionSchema = Joi.object({
  courseId: Joi.number().integer().required(),

  facultyId: Joi.number().integer().required(),

  sectionCode: Joi.string().required(),

  semester: Joi.string().required(),

  capacity: Joi.number().integer().min(1).required(),

  classroom: Joi.string().required(),

  dayOfWeek: Joi.string().required(),

  startTime: Joi.string().required(),

  endTime: Joi.string().required(),

  isActive: Joi.boolean().optional()
});

module.exports = {
  courseSectionSchema
};