var Block = require("./block")
var RegexManifest = require("./regex")
var regex = new RegexManifest();
module.exports = class Parser {

    constructor(jobId = null, documentRef = null) {
        this.jobId = jobId
        this.documentRef = documentRef
    }

    async regex(page) {
        var query = this.getQuery("LINE", page)
        var matches = {
            registrations: [],
            destinations: [],
            origins: [],
            dates: [],
            acronyms: [],
            flightNumbers: [],
            names: [],
            year: 0,
            name: "",
            motherLastname: "",
            fatherLastname: "",
            courseName: ""
        }
        var indexBeforeName = -2;
        var indexBeforeFile = -2;
        var isLastnameFirst = false;
        var filter = await Block
            .find(query)
            .populate({ path: 'child', populate: { path: 'child' } })
            .populate({ path: 'value', populate: { path: 'child' } })

        filter.forEach((elem, index) => {
            const key = elem.Text;
            // console.log('elem ------->', index, key);
            if (regex.regexDateFormat(key)) {
                var expresion = /(\d{4})/;
                (matches.year === 0) ? matches.year = Number(key.match(expresion)[0]) : null;
            } else if (regex.regexIsBeforeName(key) && indexBeforeName === -2) {
                indexBeforeName = index;
            } else if (regex.regexIsBeforeTwoLinesName(key) && indexBeforeName === -2) {
                indexBeforeName = index + 1;
                isLastnameFirst = true;
            } else if (regex.regexIsBeforeFile(key) && indexBeforeFile === -2) {
                indexBeforeFile = index;
            }
            else if (regex.regexWord(key) && key.length > 3) {

                !(matches.origins.includes(key)) ? matches.origins.push(key) : null;
                !(matches.destinations.includes(key)) ? matches.destinations.push(key) : null;
                !(matches.names.includes(key)) ? matches.names.push(key) : null;

            }
            if (index === (indexBeforeName + 1)) {
                var keyUpper = key.toUpperCase();
                var fullname = keyUpper.replace("A:", "").trim();
                var fullname = keyUpper.replace("MR.", "").trim();
                var fullname = keyUpper.replace("MRS.", "").trim();

                if (!isLastnameFirst)
                    isLastnameFirst = fullname.includes(",");
                var fullname = keyUpper.replace(",", "").trim();
                // console.log('fullname--->', fullname)
                var arr = fullname.split(" ");
                if (arr.length < 2) return;

                if (arr.length === 3){
                    var iName = isLastnameFirst ? 2 : 0;
                    var iFather = isLastnameFirst ? 0 : 2;
                    var iMother = 1;
                    (matches.name === "") ? matches.name = (arr[iName]) : null;
                    (matches.fatherLastname === "") ? matches.fatherLastname = (arr[iFather]) : null;
                    (matches.motherLastname === "") ? matches.motherLastname = (arr[iMother]) : null;
                }else{
                    var iName = isLastnameFirst ? (arr[2]) + " " + (arr[3]) : (arr[0]) + " " + (arr[1]);
                    var iFather = isLastnameFirst ? (arr[0]) : (arr[2]);
                    var iMother = isLastnameFirst ? (arr[1]) : (arr[3]);
                    (matches.name === "") ? matches.name =  iName : null;
                    (matches.fatherLastname === "") ? matches.fatherLastname = iFather : null;
                    (matches.motherLastname === "") ? matches.motherLastname = iMother : null;
                }

            }
            if (index === (indexBeforeFile + 1)) {
                var keyUpper = key.toUpperCase();
                // console.log('course--->', keyUpper);
                (matches.courseName === "") ? matches.courseName = keyUpper : null;
            }
            /*else if(){
                
            }*/
        });
        return matches

    }

    /**
     * Search key-value blocks in database and formats
     * this as Json array
     */
    async forms(page) {
        var query = this.getQuery('KEY_VALUE_SET', page)
        var form_list = []

        var filter = await Block
            .find(query)
            .populate({ path: 'child', populate: { path: 'child' } })
            .populate({ path: 'value', populate: { path: 'child' } })

        filter.forEach(element => {

            var formatted = {}
            var key = element.child.map(function (child) {
                return child.Text
            })
            var value = [];
            element.value.forEach(val_child => {
                if (val_child.child)
                    value = val_child.child.map(function (val) {
                        return val.Text
                    })
            });
            key = key.join(" ")
            value = value.join(" ")
            formatted[key] = value
            form_list.push(formatted)
        });

        return form_list
    }
    /**
     * Search table blocks in database and formats
     * this as Json array
     */
    async tables(page) {
        //,EntityTypes:{$in:['KEY']}
        var filter = await Block
            .find({ BlockType: 'TABLE', Page: page })
            .populate({ path: 'child', populate: { path: 'child' } })
            .populate({ path: 'value', populate: { path: 'child' } })

        filter.forEach(element => {
            console.log(element)
            element.child.forEach(child => {
                console.log("CHILDS: ", child)
            })
        });
        return filter
    }

    async lines(page) {
        var filter = await Block
            .find({ BlockType: 'LINE', Page: page })
            .populate({ path: 'child', populate: { path: 'child' } })
            .populate({ path: 'value', populate: { path: 'child' } })

        //console.log(filter)

    }
    /**
     * store all blocks given an array of pages that contains the page's blocks
     * 
     * @param {Array} pages Array of pages, each page contains its blocks.
     */
    async storeInDB(pages) {
        this.pagesCount = pages.length
        var currentPage = 1
        var blocks_arr = [];
        return new Promise(async (resolve, reject) => {

            pages.forEach(page => {

                page.forEach(async element => {
                    var b = new Block(element)
                    if (element.Relationships)
                        element.Relationships.forEach(async rel => {
                            if (rel.Type == 'VALUE') {
                                b.values = rel.Ids
                            }
                            if (rel.Type == 'CHILD') {
                                b.children = rel.Ids
                            }
                        });
                    if (!b.Page)
                        b.Page = currentPage
                    b.jobId = this.jobId
                    b.documentRef = this.documentRef
                    blocks_arr.push(b)
                    //await b.save()
                });
                currentPage += 1

            });

            await Block.collection.insertMany(blocks_arr);
            // let all = await Block.find({})
            //console.log(all)
            resolve({ message: "saved successfuly" })
        })


    }

    getQuery(blockType, page) {
        var query = { BlockType: blockType, Page: page }

        if (blockType == 'KEY_VALUE_SET')
            query['EntityTypes'] = { $in: ['KEY'] }

        if (this.jobId && this.documentRef) {
            query['jobId'] = this.jobId
            query['documentRef'] = this.documentRef
        }
        else if (this.jobId)
            query['jobId'] = this.jobId

        else if (this.documentRef)
            query['documentRef'] = this.documentRef

        return query
    }

}