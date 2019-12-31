
module.exports = class RegexFile{

    /**
     * Validate acronyms that could be [A-Z]2 or [A-Z]3
     * e.g MTY, MX, TRC
     * 
     * @param {String} word the acronym to validate
     */
    regexAcronyms(word){
        var acronym_exp = /(^[A-Z]{2,3})$/
        return word.match(acronym_exp) != null
    }
    
    /**
     * Validate [A-Z]2-[A-Z]3 register airplane number format
     * e.g XV-DAS
     * 
     * @param {String} word the register airplane number to validate
     */
    regexRegister(word){
        var register_exp = /(^[A-Z]{2})\-([A-Z]{3}$)/
        return word.match(register_exp) != null
    }
    
    /**
     * Validate dd/mm/yyyy date format
     * 
     * @param {String} word the string date to validate, this validate dd/mm/yyyy format
     */
    regexDate(word){
        var date_exp = /(^(?:0[0-9]|3[01]))\/(?:0[0-9]|1[02])\/([0-9]{4}$)/
        return word.match(date_exp) != null
    }
    
    /**
     * Validate words or sentences with just characteres from A to Z uppercase
     * 
     * @param {String} word  
     */
    regexWord(word){
        ///^[A-Z ]+$/
        var word_exp = /(^[A-Z ,.]+$)/;
        return word.match(word_exp) != null;
    }
    
    /**
     * Validate if given word contain the given characteres
     * 
     * @param {String} word the word
     * @param {String} chars 
     */
    regexContains(word,chars){
        var arr = chars.split("")
        var regex = "";
        arr.forEach(char => {
            regex += "(?=.*"+char+")"
        });
        var r = new RegExp(regex);
        return word.match(r) != null;
    }

    /**
     * Validate if given word is date
     * 
     * @param {String} word the word
     */
    regexDateFormat(word){
        word = word.toLowerCase();
        var date_exp = /((([0-9])|([0-2][0-9])|([3][0-1]))\ de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\ de \d{4})/
        var date_exp2 = /((([0-9])|([0-2][0-9])|([3][0-1]))\ de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\ del \d{4})/
        var date_exp_english = /\d{2}\-(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\-\d{4}/
        var isdate = (word.match(date_exp) != null || word.match(date_exp2) != null || word.match(date_exp_english)) ;
        // console.log('word---->', word);
        // console.log('isdate---->', isdate);
        return isdate;
    }

    /**
     * Validate if given word is date
     * 
     * @param {String} word the word
     */
    regexIsBeforeName(word){
        word = word.toLowerCase();
        var isBefore = (word.includes("reconocimiento a:") || word.includes("certificado") || word.includes("certifies"));
        var n = word.includes("world");
        // console.log('word---->', word);
        // console.log('isBefore---->', isBefore);
        return isBefore;
    }

    /**
     * Validate if given word is date
     * 
     * @param {String} word the word
     */
    regexIsBeforeTwoLinesName(word) {
        word = word.toLowerCase();
        var isBefore = (word.includes("constancia") );
        var n = word.includes("world");
        // console.log('word---->', word);
        // console.log('isBefore---->', isBefore);
        return isBefore;
    }

    /**
     * Validate if given word is date
     * 
     * @param {String} word the word
     */
    regexIsBeforeFile(word){
        word = word.toLowerCase();
        var isBeforeFile = (word.includes("curso:") || word.includes("curso ") || word.includes("completed"));
        // console.log('word---->', word);
        // console.log('isBeforeFile---->', isBeforeFile);
        return isBeforeFile;
    }
}
