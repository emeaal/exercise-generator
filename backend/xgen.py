import xml.etree.ElementTree as ET
import requests
import json


def process(text):
    url = "https://ws.spraakbanken.gu.se/ws/sparv/v2/"
    params = {'text': text}
    response = requests.get(url, params=params)
    xml_data = response.text

    root = ET.fromstring(xml_data)

    sentences = []
    sent_id = 0
    for sentence_elem in root.iter('sentence'):
        sentence = []
        max_sent_id = len(root.findall('sentence')) - 1
        for word_elem in sentence_elem.iter('w'):
            word = {
                'sent_id': sent_id,
                'max_sent_id': max_sent_id,
                'text': word_elem.text,
                'lemma': word_elem.get('lemma').strip('|'),
                'pos': word_elem.get('pos'),
            }
            sentence.append(word)
        sentences.extend(sentence)
        sent_id += 1

    return sentences


def process3(json_obj, chosen_pos, selectedEveryX, excludeFirstSentence,
             excludeLastSentence):
    gaps = []
    distance_to_prev_gap = 0
    prev_pos = None
    json_obj = json.loads(json_obj)

    chosen_pos_list = chosen_pos.split(',')
    last_sent_id = max([line['sent_id'] for line in json_obj])

    for i, line in enumerate(json_obj):
        if excludeFirstSentence == True and line['sent_id'] == 0:
            continue
        if excludeLastSentence == True and line['sent_id'] == last_sent_id:
            continue
        if distance_to_prev_gap >= 1 and distance_to_prev_gap < selectedEveryX:
            distance_to_prev_gap += 1
        elif distance_to_prev_gap == selectedEveryX:
            distance_to_prev_gap = 0
            continue
        else:
            if line['pos'] in chosen_pos_list:
                if prev_pos == "MID":
                    distance_to_prev_gap += 1
                else:
                    gaps.append(i)
                    distance_to_prev_gap += 1

        prev_pos = line['pos']
    return gaps


def process2(json_obj, exclude_first, exclude_last, everyx):
    res = {"targets": [], "targets_lemma": [], "tokens": [], "title": None}
    distance_to_prev_gap = -1
    every = everyx
    tpos = "NOUN"
    for i, line in enumerate(json_obj):

        nobj = dict()
        nobj["word"] = line["text"]
        nobj["pos"] = line["pos"]
        nobj["lemma"] = line["lemma"]

        target = line["text"].lower()
        target_lemma = line["lemma"].lower()
        if line["pos"] == "LINEBREAK":
            res["tokens"].append(nobj)
            continue
        if exclude_first and line["sent_id"] and line["sent_id"] == 0:
            res["tokens"].append(nobj)
            continue
        if exclude_last and line["sent_id"] and line["sent_id"] == line[
                "max_sent_id"]:
            res["tokens"].append(nobj)
            continue
        if line["pos"] == tpos:
            if target not in res["targets"]:
                res["targets"].append(target)
            if target_lemma not in res["targets_lemma"]:
                res["targets_lemma"].append(target_lemma)
            if "exclude" in line and line["exclude"] == "true":
                continue
            if distance_to_prev_gap == -1:
                distance_to_prev_gap += 1
                nobj["gap"] = True
                accepted = None
                try:
                    accepted = [ps[0]]
                    accepted.extend(ps[3].split(","))
                except:
                    accepted = [target]
                nobj["accept"] = accepted
            if distance_to_prev_gap > -1 and distance_to_prev_gap >= every:
                distance_to_prev_gap = 0
                nobj["gap"] = True
                accepted = None
                try:
                    accepted = [ps[0]]
                    accepted.extend(ps[3].split(","))
                except:
                    accepted = [target]
                nobj["accept"] = accepted
        distance_to_prev_gap += 1
        res["tokens"].append(nobj)
    return res


def create_table(words):
    nouns = {}
    verbs = {}
    adj = {}
    not_valid_word = {}

    for word in words.split(","):
        lemma = word.lower().strip()
        api_url = f"https://ws.spraakbanken.gu.se/ws/karp/v4/query?q=extended||and|wf|equals|{lemma}&resource=saldom"

        try:
            response = requests.get(api_url)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"Error retrieving data for '{lemma}': {e}")
            continue
        except IndexError as e:
            print(f"Error retrieving data for '{lemma}': {e}")
            continue

        data = response.json()
        word_forms = data["hits"]["hits"][0]["_source"]["WordForms"]
        pos = data["hits"]["hits"][0]["_source"]["FormRepresentations"][0][
            "partOfSpeech"]

        if pos == "nn":
            gender = data["hits"]["hits"][0]["_source"]["FormRepresentations"][
                0]["inherent"]
            if gender == "u":
                gender = "En"
            elif gender == "n":
                gender = "Ett"
            noun_table = generate_noun_table(gender, word_forms)
            nouns[lemma] = {
                "word": lemma,
                "wordClass": "noun",
                "inflections": noun_table
            }
        elif pos == "vb":
            verb_table = generate_verb_table(word_forms)
            verbs[lemma] = {
                "word": lemma,
                "wordClass": "verb",
                "inflections": verb_table
            }
        elif pos == "av":
            adj_table = generate_adj_table(word_forms)
            adj[lemma] = {
                "word": lemma,
                "wordClass": "adjective",
                "inflections": adj_table
            }
        else:
            not_valid_word[lemma] = {
                "word": lemma,
                "wordClass": "None",
                "inflections": "None"
    }

        

    msd_word_list = [nouns[word]
                     for word in nouns] + [verbs[word] for word in verbs
                                           ] + [adj[word] for word in adj] + [not_valid_word[word] for word in not_valid_word]
    print(msd_word_list)
    return msd_word_list


def generate_verb_table(word_forms):
    excluded_msd = [
        "c", "sms", "ci", "cm", "pres konj aktiv", "pret ind s-form",
        "pret konj aktiv", "pres konj s-form", "pres ind s-form "
    ]
    msd_words = {}

    for form in word_forms:
        msd = form["msd"]
        if not msd.startswith("pret_part") and msd not in excluded_msd:
            if msd not in msd_words:
                msd_words[msd] = []
            msd_words[msd].append(form["writtenForm"])

    return msd_words


def generate_adj_table(word_forms):
    msd_words = {}

    for form in word_forms:
        msd = form["msd"]
        if msd in [
                'pos indef sg u nom', 'pos indef sg n nom', 'pos indef pl nom',
                'komp nom', 'super indef nom', 'writtenForm'
        ]:
            msd_words[msd] = []
            msd_words[msd].append(form["writtenForm"])

    return msd_words


def generate_noun_table(gender, word_forms):
    msd_words = {}

    for form in word_forms:
        msd = form["msd"]
        if msd not in ["c", "sms", "ci", "cm"]:
            msd_words[msd] = []
            msd_words[msd].append(form["writtenForm"])
    '''if gender == "En":
        msd_words["sg_indef_nom"] = [word_forms[0]["writtenForm"]]
    elif gender == "Ett":
        msd_words["sg_indef_nom"] = [word_forms[1]["writtenForm"]]'''

    return msd_words


def make_grammar_ex(text):
    url = "https://ws.spraakbanken.gu.se/ws/sparv/v2/"
    params = {'text': text}
    response = requests.get(url, params=params)
    xml_data = response.text

    root = ET.fromstring(xml_data)

    sentences = []
    sent_id = 0
    for sentence_elem in root.iter('sentence'):
        sentence = []
        max_sent_id = len(root.findall('sentence')) - 1
        for word_elem in sentence_elem.iter('w'):
            word = {
                'sent_id': sent_id,
                'max_sent_id': max_sent_id,
                'text': word_elem.text,
                'lemma': word_elem.get('lemma').strip('|'),
                'pos': word_elem.get('pos'),
                'msd': word_elem.get('msd'),
                'dephead': word_elem.get('dephead'),
                'deprel': word_elem.get('deprel')
            }
            sentence.append(word)
        sentences.extend(sentence)
        sent_id += 1

    print(sentences)
    return sentences


def check_agreement(list1, list2):
    for word in list1 + list2:
        if "+" in word:
            parts = word.split("+")
            if not (parts[0] in list2 or parts[1] in list2):
                return "incorrect"
        elif word not in list2:
            return "incorrect"
    return "correct"


def process_grammar_data(data):
    processed_data = make_grammar_ex(data)
    processed_dict = {}
    for item in processed_data:
        if item['deprel'] in {'AT', 'DT'}:
            head = int(item['dephead']) - 1
            head_item = processed_data[head]
            word = item
            msd_word = item['msd'].split('.')[1:]
            msd_head = head_item['msd'].split('.')[1:]
            if item['deprel'] == 'DT':
                msd_head = msd_head[:3]
            text = item['text']
            print(text)
            result = check_agreement(msd_word, msd_head)
            processed_dict[text] = result
        else:
            text = item['text']
            processed_dict[text] = "correct"
            print(text)
    print(processed_dict)
    return processed_dict