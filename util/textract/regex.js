
module.exports = class RegexManifest{

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

}
