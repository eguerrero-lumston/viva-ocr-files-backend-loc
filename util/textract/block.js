const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/ocr', {useNewUrlParser: true, useUnifiedTopology: true});

var BlockSchema = new mongoose.Schema({
    jobId:String,
    documentRef:String,
    BlockType: String,
    Confidence: mongoose.Schema.Types.Number,
    Text: String,
    EntityTypes: [{type:String}],
    RowSpan: Number, 
    RowIndex: Number, 
    ColumnIndex: Number, 
    ColumnSpan: Number, 
    Geometry:
    { BoundingBox:
        { Width: mongoose.Schema.Types.Decimal128,
            Height: mongoose.Schema.Types.Decimal128,
            Left: mongoose.Schema.Types.Decimal128,
            Top: mongoose.Schema.Types.Decimal128 },
        Polygon: [] },
    Id: String,
    Relationships: [{ Type: String, Ids:[String] }],
    children:[
        {type:String}
    ],
    values:[{type:String}],
    Page: Number 
},{
    toJson:{virtuals:true},
    toObject: {virtuals:true}
});

/**
 * CHILD relationships
 */
BlockSchema.virtual('child', {
    ref: 'Block', // The model to use
    localField: 'children', // Find blocks where `localField`
    foreignField: 'Id', // is equal to `foreignField` */
    justOne: false,
    options: { /*sort: { name: -1 },*/ limit: 50 }
});

/**
 * VALUE relationships
 */
BlockSchema.virtual('value', {
    ref: 'Block', // The model to use
    localField: 'values', // Find blocks where `localField`
    foreignField: 'Id', // is equal to `foreignField` */
    justOne: false,
    options: { /*sort: { name: -1 }*/ limit: 5 }
});

const Block = mongoose.model('Block',BlockSchema)

module.exports = Block